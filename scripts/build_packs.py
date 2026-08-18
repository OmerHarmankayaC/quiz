#!/usr/bin/env python3
"""Tematik paketleri bankadan uretir -> data/bank/packs.json

Spec kurali: paket basina 10 soru, 3 fermi + 7 mcq. Fermi kotasi sabit cunku
oyunun imzasi olan pecete hesabi her pakette cikmali.

Ama iki hattin konu profili birbirinin tersi: fermi cografya/yiyecek/ekonomi
agirlikli, mcq ise tarih agirlikli (wiki korpusunun dogasi). Bazi temalarda
7 mcq bulunamiyor - orn. mutfak temasinda bankada tek bir yiyecek mcq'su var.
Bu yuzden kural su sekilde uygulanir: FERMI KOTASI ALT SINIR (en az 3), toplam
10; bir moddan yeterli soru cikmazsa eksik digerinden tamamlanir ve durum
raporlanir. Boylece tema butunlugu bozulmadan paket dolar.

Secim tamamen deterministik: ayni banka -> ayni paketler. Rastgelelik yok.

Kullanim:
    python3 scripts/build_packs.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BANK = KOK / "data" / "bank"
CIKTI = BANK / "packs.json"

PAKET_BOYU = 10
MIN_FERMI = 3
HEDEF_MCQ = 7

# Temalar bankada gercekten dolacak sekilde secildi. Renkler karanlik tema
# icin: koyu zemin + acik metin, kart tipografik olarak bu ikisinden turetilir.
TEMALAR = [
    {
        "slug": "tarihin-rakamlari",
        "baslik": "Tarihin Rakamları",
        "aciklama": "Piramitlerden anayasa oylamalarına, tarihin sayıya dökülmüş hâli.",
        "renk": "#3A1F1B",
        "metin_rengi": "#FBEAE3",
        "konular": ["tarih", "arkeoloji", "askeri"],
    },
    {
        "slug": "dunyayi-olcmek",
        "baslik": "Dünyayı Ölçmek",
        "aciklama": "Kıyı şeritleri, dağlar, şehirler — gezegeni rakamlarla tartmak.",
        "renk": "#10322E",
        "metin_rengi": "#E3F5EE",
        "konular": ["coğrafya", "doğa", "çevre"],
    },
    {
        "slug": "mutfaktaki-fizik",
        "baslik": "Mutfaktaki Fizik",
        "aciklama": "Bir kutu spagetti kaç metre? Yemek masasında büyüklük sezgisi.",
        "renk": "#2E2416",
        "metin_rengi": "#F7EEDC",
        "konular": ["yiyecek", "günlük"],
    },
    {
        "slug": "ekranlar-ve-sesler",
        "baslik": "Ekranlar ve Sesler",
        "aciklama": "Şarkılar, filmler, diziler — kültürün ölçülebilir tarafı.",
        "renk": "#331A2B",
        "metin_rengi": "#FAE8F4",
        "konular": ["müzik", "film", "tiyatro", "kitap"],
    },
    {
        "slug": "bilim-ve-uzay",
        "baslik": "Bilim ve Uzay",
        "aciklama": "Atom saatinden süpernovaya, laboratuvardan yörüngeye.",
        "renk": "#26215C",
        "metin_rengi": "#EEEDFE",
        "konular": ["bilim", "uzay", "fizik", "matematik"],
    },
    {
        "slug": "sahada-ve-pistte",
        "baslik": "Sahada ve Pistte",
        "aciklama": "Goller, kupalar, rekorlar. Sporun sayılarla anlatımı.",
        "renk": "#1B2A3A",
        "metin_rengi": "#E4F0FA",
        "konular": ["spor"],
    },
]


def eslesme_puani(soru: dict, konular: list[str]) -> int:
    """Kac tema konusu sorunun etiketlerinde geciyor. 0 = tema disi."""
    return sum(1 for k in konular if k in soru["topics"])


def zorluk_dengeli_sec(adaylar: list[dict], adet: int) -> list[dict]:
    """Zorluk kovalarindan sirayla toplayarak paket icini dengeler.

    Duz siralamada tek zorluk seviyesinden dolan paketler cikiyordu; bu
    round-robin, her pakette kolay/orta/zor karisimini garanti eder.
    """
    kovalar = {1: [], 2: [], 3: []}
    for s in adaylar:
        kovalar[s["difficulty"]].append(s)

    secilen: list[dict] = []
    while len(secilen) < adet:
        eklendi = False
        for z in (2, 1, 3):  # ortadan basla: paketin omurgasi orta zorluk
            if kovalar[z] and len(secilen) < adet:
                secilen.append(kovalar[z].pop(0))
                eklendi = True
        if not eklendi:
            break
    return secilen


def temaya_gore_sirala(havuz: list[dict], konular: list[str], kullanilan: set[str]) -> list[dict]:
    adaylar = [
        s for s in havuz
        if s["id"] not in kullanilan and eslesme_puani(s, konular) > 0
    ]
    # Once konuya en cok uyan, esitlikte id sirasi -> tam deterministik.
    adaylar.sort(key=lambda s: (-eslesme_puani(s, konular), s["id"]))
    return adaylar


def main() -> None:
    fermi = json.loads((BANK / "fermi.json").read_text(encoding="utf-8"))
    mcq = json.loads((BANK / "mcq.json").read_text(encoding="utf-8"))

    takvim_yolu = BANK / "calendar.json"
    takvim_sorulari: set[str] = set()
    if takvim_yolu.exists():
        takvim = json.loads(takvim_yolu.read_text(encoding="utf-8"))
        takvim_sorulari = {qid for gun in takvim for qid in gun["soru_ids"]}

    kullanilan: set[str] = set(takvim_sorulari)
    paket_kullanilan: set[str] = set()
    paketler = []
    raporlar = []

    for tema in TEMALAR:
        konular = tema["konular"]
        f_adaylar = temaya_gore_sirala(fermi, konular, kullanilan)
        m_adaylar = temaya_gore_sirala(mcq, konular, kullanilan)

        # MCQ once secilir: kit olan taraf o. Fermi havuzu her temada genis.
        m_secim = zorluk_dengeli_sec(m_adaylar, min(HEDEF_MCQ, len(m_adaylar)))
        kalan = PAKET_BOYU - len(m_secim)
        f_secim = zorluk_dengeli_sec(f_adaylar, min(kalan, len(f_adaylar)))

        # Fermi alt siniri: pecete hesabi her pakette cikmali.
        if len(f_secim) < MIN_FERMI:
            raporlar.append(
                f"  {tema['slug']}: yalnizca {len(f_secim)} fermi bulundu "
                f"(alt sinir {MIN_FERMI}) - tema konulari genisletilmeli"
            )

        # Toplam 10'a ulasilamadiysa mcq'dan tamamla (tema disina cikmadan).
        eksik = PAKET_BOYU - len(f_secim) - len(m_secim)
        if eksik > 0:
            ekstra = [s for s in m_adaylar if s not in m_secim][:eksik]
            m_secim += ekstra

        secim = f_secim + m_secim
        if len(secim) < PAKET_BOYU:
            raporlar.append(
                f"  {tema['slug']}: {len(secim)}/{PAKET_BOYU} soru - banka bu temada yetersiz"
            )

        for s in secim:
            kullanilan.add(s["id"])
            paket_kullanilan.add(s["id"])

        paketler.append(
            {
                "slug": tema["slug"],
                "baslik": tema["baslik"],
                "aciklama": tema["aciklama"],
                "renk": tema["renk"],
                "metin_rengi": tema["metin_rengi"],
                "soru_ids": [s["id"] for s in secim],
            }
        )

        f_say = len(f_secim)
        m_say = len(secim) - f_say
        print(f"{tema['baslik']:<22} {f_say} fermi + {m_say} mcq = {len(secim)}")

    CIKTI.write_text(json.dumps(paketler, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\n{len(paketler)} paket -> {CIKTI.relative_to(KOK)} ({len(paket_kullanilan)} soru kullanildi)")
    if raporlar:
        print("\nnotlar:")
        for r in raporlar:
            print(r)


if __name__ == "__main__":
    main()
