#!/usr/bin/env python3
"""MCQ aday paketleri uretir.

Girdi verisi (embed_data_copy) bir retrieval egitim seti; icindeki hazir sorular
"bu paragrafi geri getir" amacli uretilmis, quiz sorusu olarak cogu kullanilamaz
(baglamsiz, nis, tek kisa cevabi yok). Bu yuzden soruyu degil PARAGRAFI aliyoruz;
hazir sorunun varligi yalnizca "bu paragraf soru uretmeye elverisli" sinyali.

Aday secimi uc sinyale dayanir:
  1. Taninirlik  - wiki makalesinin uzunlugu (kac paragraf) ve sayfa id'si.
                   Uzun makale = onemli konu. Dusuk id = erken olusturulmus,
                   genelde merkezi kavramlar (Cengiz Han = 10).
  2. Somutluk    - paragrafta yil/sayi/ozel isim var mi. Net cevabi olmayan
                   paragraftan iyi coktan secmeli cikmaz.
  3. Cesitlilik  - sayfa basina en fazla 1 aday, yoksa banka tek konuya bogulur.

Her aday icin embedding komsulari da eklenir: ayni semantik bolgedeki baska
paragraflarin baslik ve metinleri, celdirici yazarken baglam olsun diye.

Kullanim:
    python3 scripts/mcq_candidates.py [--hedef 800] [--komsu 5]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path

import numpy as np

KOK = Path(__file__).resolve().parent.parent
EMBED = KOK / "data" / "embed_data_copy"
PARAGRAFLAR = EMBED / "islenmis" / "paragraflar.jsonl"
SORULAR = EMBED / "sorular_filtreli.jsonl"
VEKTORLER = EMBED / "embeddings" / "korpus_e5_small.dat"
CIKTI = KOK / "data" / "work" / "mcq-candidates.jsonl"

BOYUT = 384  # e5-small

# Paragraf uzunluk siniri: kisa olan yeterli bilgi tasimaz, cok uzun olani
# okuyup tek soruya indirgemek zor.
MIN_KARAKTER = 300
MAX_KARAKTER = 1600

YIL = re.compile(r"\b(1[0-9]{3}|20[0-2][0-9])\b")
SAYI = re.compile(r"\b\d[\d.,]{2,}\b")
OZEL_ISIM = re.compile(r"(?<![.!?]\s)(?<!^)\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\b")

# Quiz'e uygun olmayan konu isaretleri: liste/tablo paragraflari, disambiguation,
# sezon/bolum dokumleri. Bunlardan iyi soru cikmiyor.
KOTU_BASLIK = re.compile(
    r"(listesi|sezonu|bölümleri|\(anlam ayrımı\)|şablon|kategori:|maç|fikstür)", re.I
)


def paragraflari_yukle() -> tuple[list[dict], Counter]:
    """paragraflar.jsonl'i sirayla okur. Satir sirasi embedding satir sirasidir."""
    kayitlar: list[dict] = []
    sayfa_uzunlugu: Counter = Counter()
    with PARAGRAFLAR.open(encoding="utf-8") as f:
        for satir in f:
            d = json.loads(satir)
            kayitlar.append(d)
            sayfa_uzunlugu[d["kaynak_id"].split("#")[0]] += 1
    return kayitlar, sayfa_uzunlugu


def soru_tasiyan_paragraflar() -> dict[str, list[str]]:
    """kaynak_id -> o paragraf icin uretilmis hazir sorular."""
    esleme: dict[str, list[str]] = {}
    with SORULAR.open(encoding="utf-8") as f:
        for satir in f:
            d = json.loads(satir)
            esleme.setdefault(d["kaynak_id"], []).append(d["query"])
    return esleme


def somutluk_puani(metin: str) -> float:
    """Paragrafin net cevabi olan soru uretmeye ne kadar elverisli oldugu (0-1)."""
    yil = len(YIL.findall(metin))
    sayi = len(SAYI.findall(metin))
    isim = len(set(OZEL_ISIM.findall(metin)))
    # Her sinyal doygunlasiyor: 3 yil ile 30 yil arasinda anlamli fark yok.
    return (min(yil, 3) / 3 + min(sayi, 4) / 4 + min(isim, 8) / 8) / 3


def taninirlik_puani(sayfa_id: str, paragraf_sayisi: int) -> float:
    """Uzun makale = onemli konu. Dusuk wiki id = merkezi kavram."""
    uzunluk = min(paragraf_sayisi, 40) / 40
    try:
        yenilik = max(0.0, 1.0 - int(sayfa_id) / 500_000)
    except ValueError:
        yenilik = 0.0
    return 0.7 * uzunluk + 0.3 * yenilik


def adaylari_sec(kayitlar, sayfa_uzunlugu, sorular, hedef: int) -> list[dict]:
    puanlilar = []
    for idx, d in enumerate(kayitlar):
        kid = d["kaynak_id"]
        if kid not in sorular:
            continue
        metin = d["metin"]
        if not (MIN_KARAKTER <= len(metin) <= MAX_KARAKTER):
            continue
        if KOTU_BASLIK.search(d["baslik"]):
            continue

        somut = somutluk_puani(metin)
        if somut < 0.45:  # net cevap cikmayacak paragraflari erken ele
            continue

        sayfa_id = kid.split("#")[0]
        taninir = taninirlik_puani(sayfa_id, sayfa_uzunlugu[sayfa_id])
        puanlilar.append(
            {
                "index": idx,
                "kaynak_id": kid,
                "sayfa_id": sayfa_id,
                "baslik": d["baslik"],
                "metin": metin,
                "hazir_sorular": sorular[kid][:3],
                "puan": round(0.6 * taninir + 0.4 * somut, 4),
            }
        )

    puanlilar.sort(key=lambda x: -x["puan"])

    # Sayfa basina 1: banka tek konuya bogulmasin.
    secilen, gorulen = [], set()
    for a in puanlilar:
        if a["sayfa_id"] in gorulen:
            continue
        gorulen.add(a["sayfa_id"])
        secilen.append(a)
        if len(secilen) >= hedef:
            break
    return secilen


def komsulari_ekle(secilen: list[dict], kayitlar: list[dict], k: int) -> None:
    """Her aday icin en yakin k paragrafi bulur (celdirici baglami)."""
    n = len(kayitlar)
    V = np.memmap(VEKTORLER, dtype=np.float32, mode="r", shape=(n, BOYUT))

    # e5 ciktilari normalize gelir ama garanti degil; kontrol edip gerekirse
    # normalize ediyoruz, yoksa nokta carpim kosinus olmaz.
    ornek_norm = float(np.linalg.norm(V[0]))
    normalize_gerek = abs(ornek_norm - 1.0) > 0.01
    print(f"  vektor normu ~{ornek_norm:.3f}"
          f"{' -> normalize edilecek' if normalize_gerek else ''}", file=sys.stderr)

    idx = np.array([a["index"] for a in secilen])
    Q = np.array(V[idx], dtype=np.float32)
    if normalize_gerek:
        Q /= np.linalg.norm(Q, axis=1, keepdims=True) + 1e-9

    # Korpus 460MB; parca parca tarayip her aday icin en iyi k'yi tutuyoruz.
    PARCA = 25_000
    en_iyi_skor = np.full((len(secilen), k), -np.inf, dtype=np.float32)
    en_iyi_idx = np.zeros((len(secilen), k), dtype=np.int64)

    for bas in range(0, n, PARCA):
        son = min(bas + PARCA, n)
        blok = np.array(V[bas:son], dtype=np.float32)
        if normalize_gerek:
            blok /= np.linalg.norm(blok, axis=1, keepdims=True) + 1e-9
        skor = Q @ blok.T  # (aday, parca)

        birlesik_skor = np.hstack([en_iyi_skor, skor])
        birlesik_idx = np.hstack([en_iyi_idx, np.arange(bas, son)[None, :].repeat(len(secilen), 0)])
        ust = np.argpartition(-birlesik_skor, k, axis=1)[:, :k]
        satir = np.arange(len(secilen))[:, None]
        en_iyi_skor = birlesik_skor[satir, ust]
        en_iyi_idx = birlesik_idx[satir, ust]
        print(f"\r  komsu taramasi {son}/{n}", end="", file=sys.stderr)
    print(file=sys.stderr)

    for i, aday in enumerate(secilen):
        sira = np.argsort(-en_iyi_skor[i])
        komsular = []
        for j in sira:
            gi = int(en_iyi_idx[i][j])
            if gi == aday["index"]:
                continue  # kendisi
            k_rec = kayitlar[gi]
            if k_rec["kaynak_id"].split("#")[0] == aday["sayfa_id"]:
                continue  # ayni makale, celdirici olarak degersiz
            komsular.append(
                {
                    "baslik": k_rec["baslik"],
                    "ozet": k_rec["metin"][:400],
                    "benzerlik": round(float(en_iyi_skor[i][j]), 4),
                }
            )
        aday["komsular"] = komsular[: k - 1]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hedef", type=int, default=800, help="uretilecek aday sayisi")
    ap.add_argument("--komsu", type=int, default=6, help="aday basina taranacak komsu")
    args = ap.parse_args()

    print("paragraflar okunuyor...", file=sys.stderr)
    kayitlar, sayfa_uzunlugu = paragraflari_yukle()
    print(f"  {len(kayitlar)} paragraf, {len(sayfa_uzunlugu)} makale", file=sys.stderr)

    beklenen = len(kayitlar) * BOYUT * 4
    gercek = VEKTORLER.stat().st_size
    if beklenen != gercek:
        sys.exit(f"HIZA HATASI: embedding {gercek} bayt, beklenen {beklenen}")
    print(f"  embedding hizasi dogrulandi ({len(kayitlar)}x{BOYUT})", file=sys.stderr)

    print("hazir sorular esleniyor...", file=sys.stderr)
    sorular = soru_tasiyan_paragraflar()
    print(f"  {len(sorular)} paragrafin sorusu var", file=sys.stderr)

    print("adaylar secilliyor...", file=sys.stderr)
    secilen = adaylari_sec(kayitlar, sayfa_uzunlugu, sorular, args.hedef)
    print(f"  {len(secilen)} aday (sayfa basina 1)", file=sys.stderr)

    print("embedding komsulari cikariliyor...", file=sys.stderr)
    komsulari_ekle(secilen, kayitlar, args.komsu)

    CIKTI.parent.mkdir(parents=True, exist_ok=True)
    with CIKTI.open("w", encoding="utf-8") as f:
        for a in secilen:
            a.pop("index", None)
            f.write(json.dumps(a, ensure_ascii=False) + "\n")

    print(f"\nyazildi -> {CIKTI.relative_to(KOK)} ({len(secilen)} aday)", file=sys.stderr)
    print("puan araligi: %.3f - %.3f" % (secilen[-1]["puan"], secilen[0]["puan"]), file=sys.stderr)


if __name__ == "__main__":
    main()
