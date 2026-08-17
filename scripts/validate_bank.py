#!/usr/bin/env python3
"""Soru bankasi kalite kapisi. Commit oncesi calistirilir.

Yakaladigi hatalar:
  - sema ihlalleri (eksik alan, bos deger, gecersiz indeks)
  - tekrar eden sorular
  - MCQ'da ayni sikkin iki kez yazilmasi
  - "en uzun sik hep dogru cevap" sizintisi - modelin ve dikkatli oyuncunun
    soruyu okumadan bilmesini saglayan klasik hata
  - dogru cevap indeksinin dengesizligi

Cikis kodu 0 = temiz, 1 = hata var.

Kullanim:
    python3 scripts/validate_bank.py
"""

from __future__ import annotations

import json
import sys
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
FERMI = KOK / "data" / "bank" / "fermi.json"
MCQ = KOK / "data" / "bank" / "mcq.json"
PACKS = KOK / "data" / "bank" / "packs.json"
CALENDAR = KOK / "data" / "bank" / "calendar.json"

hatalar: list[str] = []
uyarilar: list[str] = []


def yukle(yol: Path) -> list[dict]:
    if not yol.exists():
        uyarilar.append(f"{yol.relative_to(KOK)} yok, atlandi")
        return []
    return json.loads(yol.read_text(encoding="utf-8"))


def ortak_kontrol(kayitlar: list[dict], etiket: str) -> None:
    idler = Counter(k.get("id") for k in kayitlar)
    for qid, adet in idler.items():
        if adet > 1:
            hatalar.append(f"{etiket}: '{qid}' id'si {adet} kez kullanilmis")

    promptlar = Counter(k.get("prompt", "").strip().lower() for k in kayitlar)
    for p, adet in promptlar.items():
        if adet > 1:
            hatalar.append(f"{etiket}: ayni soru {adet} kez -> {p[:70]}")

    for k in kayitlar:
        qid = k.get("id", "?")
        if not k.get("prompt", "").strip():
            hatalar.append(f"{etiket} {qid}: prompt bos")
        if not k.get("source"):
            uyarilar.append(f"{etiket} {qid}: source bos")
        if k.get("difficulty") not in (1, 2, 3):
            hatalar.append(f"{etiket} {qid}: gecersiz difficulty {k.get('difficulty')}")
        if not k.get("topics"):
            uyarilar.append(f"{etiket} {qid}: topics bos")


def fermi_kontrol(kayitlar: list[dict]) -> None:
    for k in kayitlar:
        qid = k.get("id", "?")
        cevap = k.get("answer")
        if cevap is None:
            hatalar.append(f"fermi {qid}: answer yok - dogrulanmamis soru bankaya girmemeli")
        elif not isinstance(cevap, (int, float)) or cevap <= 0:
            hatalar.append(f"fermi {qid}: answer sayisal ve pozitif olmali ({cevap!r})")
        if not k.get("unit", "").strip():
            hatalar.append(f"fermi {qid}: unit bos")
        if not k.get("verified_at"):
            uyarilar.append(f"fermi {qid}: verified_at yok")


def mcq_kontrol(kayitlar: list[dict]) -> None:
    en_uzun_dogru = 0
    for k in kayitlar:
        qid = k.get("id", "?")
        sikler = k.get("choices", [])
        dogru = k.get("correct_index")

        if len(sikler) != 4:
            hatalar.append(f"mcq {qid}: 4 sik olmali, {len(sikler)} var")
            continue
        if not isinstance(dogru, int) or not 0 <= dogru < 4:
            hatalar.append(f"mcq {qid}: gecersiz correct_index {dogru!r}")
            continue
        if len(set(s.strip().lower() for s in sikler)) != 4:
            hatalar.append(f"mcq {qid}: siklarda tekrar var -> {sikler}")
        if any(not s.strip() for s in sikler):
            hatalar.append(f"mcq {qid}: bos sik var")
        if not k.get("explanation", "").strip():
            uyarilar.append(f"mcq {qid}: explanation bos")

        uzunluklar = [len(s) for s in sikler]
        if uzunluklar[dogru] == max(uzunluklar) and uzunluklar.count(max(uzunluklar)) == 1:
            en_uzun_dogru += 1

    if kayitlar:
        oran = en_uzun_dogru / len(kayitlar)
        mesaj = (f"mcq: sorularin %{oran*100:.0f}'inde dogru cevap tek basina en uzun sik "
                 f"({en_uzun_dogru}/{len(kayitlar)})")
        # Sansta beklenen ~%25-30. Belirgin sapma, soruyu okumadan cozulebilir
        # bir banka demek.
        (hatalar if oran > 0.45 else uyarilar).append(mesaj)

        dagilim = Counter(k["correct_index"] for k in kayitlar if isinstance(k.get("correct_index"), int))
        if len(kayitlar) >= 40:
            beklenen = len(kayitlar) / 4
            for i in range(4):
                if abs(dagilim.get(i, 0) - beklenen) > beklenen * 0.6:
                    uyarilar.append(f"mcq: {i}. indeks dengesiz ({dagilim.get(i, 0)}/{len(kayitlar)})")


def paket_kontrol(paketler: list[dict], dizin: dict[str, dict]) -> None:
    sluglar = Counter(p.get("slug") for p in paketler)
    for slug, adet in sluglar.items():
        if adet > 1:
            hatalar.append(f"paket: '{slug}' slug'i {adet} kez kullanilmis")

    gorulen_soru: dict[str, str] = {}
    for p in paketler:
        slug = p.get("slug", "?")
        idler = p.get("soru_ids", [])

        if len(idler) != 10:
            uyarilar.append(f"paket {slug}: 10 soru bekleniyor, {len(idler)} var")
        if len(set(idler)) != len(idler):
            hatalar.append(f"paket {slug}: ayni soru birden fazla kez listelenmis")

        for alan in ("baslik", "aciklama", "renk", "metin_rengi"):
            if not p.get(alan):
                hatalar.append(f"paket {slug}: '{alan}' bos")
        for alan in ("renk", "metin_rengi"):
            deger = p.get(alan, "")
            if deger and not (deger.startswith("#") and len(deger) == 7):
                hatalar.append(f"paket {slug}: {alan} '#RRGGBB' bicminde olmali ({deger})")

        fermi_sayisi = 0
        for qid in idler:
            soru = dizin.get(qid)
            if soru is None:
                hatalar.append(f"paket {slug}: bankada olmayan soru '{qid}'")
                continue
            if soru["mode"] == "fermi":
                fermi_sayisi += 1
            if qid in gorulen_soru:
                hatalar.append(
                    f"paket {slug}: '{qid}' zaten '{gorulen_soru[qid]}' paketinde"
                )
            gorulen_soru[qid] = slug

        # Pecete hesabi her pakette cikmali - bu yuzden fermi bir alt sinir.
        if fermi_sayisi < 3:
            hatalar.append(f"paket {slug}: en az 3 fermi gerekli, {fermi_sayisi} var")


def takvim_kontrol(takvim: list[dict], dizin: dict[str, dict], paketler: list[dict]) -> None:
    paket_sorulari = {qid for p in paketler for qid in p.get("soru_ids", [])}

    tarihler = Counter(g.get("tarih") for g in takvim)
    for t, adet in tarihler.items():
        if adet > 1:
            hatalar.append(f"takvim: '{t}' tarihi {adet} kez var")

    onceki_tarih = None
    onceki_no = 0
    kullanilan: dict[str, str] = {}

    for gun in takvim:
        tarih = gun.get("tarih", "?")
        idler = gun.get("soru_ids", [])

        if len(idler) != 3:
            hatalar.append(f"takvim {tarih}: 3 soru bekleniyor, {len(idler)} var")
        if len(set(idler)) != len(idler):
            hatalar.append(f"takvim {tarih}: gun icinde ayni soru tekrarliyor")

        no = gun.get("no")
        if not isinstance(no, int) or no != onceki_no + 1:
            hatalar.append(f"takvim {tarih}: 'no' ardisik degil ({onceki_no} -> {no})")
        onceki_no = no if isinstance(no, int) else onceki_no

        try:
            bugun = date.fromisoformat(tarih)
        except ValueError:
            hatalar.append(f"takvim: gecersiz tarih '{tarih}' (YYYY-MM-DD olmali)")
            continue
        if onceki_tarih and bugun != onceki_tarih + timedelta(days=1):
            hatalar.append(f"takvim: {onceki_tarih} ile {bugun} arasinda gun atlanmis")
        onceki_tarih = bugun

        for qid in idler:
            if qid not in dizin:
                hatalar.append(f"takvim {tarih}: bankada olmayan soru '{qid}'")
                continue
            if qid in kullanilan:
                hatalar.append(f"takvim {tarih}: '{qid}' {kullanilan[qid]} gununde de var")
            kullanilan[qid] = tarih
            if qid in paket_sorulari:
                hatalar.append(f"takvim {tarih}: '{qid}' bir pakette de kullanilmis")


def main() -> None:
    fermi = yukle(FERMI)
    mcq = yukle(MCQ)
    paketler = yukle(PACKS)
    takvim = yukle(CALENDAR)

    if fermi:
        ortak_kontrol(fermi, "fermi")
        fermi_kontrol(fermi)
    if mcq:
        ortak_kontrol(mcq, "mcq")
        mcq_kontrol(mcq)

    dizin = {q["id"]: q for q in fermi + mcq if q.get("id")}
    if paketler:
        paket_kontrol(paketler, dizin)
    if takvim:
        takvim_kontrol(takvim, dizin, paketler)

    print(f"fermi: {len(fermi)} soru | mcq: {len(mcq)} soru | toplam: {len(fermi) + len(mcq)}")
    print(f"paket: {len(paketler)} | takvim: {len(takvim)} gun")

    if uyarilar:
        print(f"\n{len(uyarilar)} uyari:")
        for u in uyarilar[:15]:
            print(f"  ~ {u}")
        if len(uyarilar) > 15:
            print(f"  ... {len(uyarilar) - 15} uyari daha")

    if hatalar:
        print(f"\n{len(hatalar)} HATA:")
        for h in hatalar[:25]:
            print(f"  x {h}")
        if len(hatalar) > 25:
            print(f"  ... {len(hatalar) - 25} hata daha")
        sys.exit(1)

    print("\nkalite kapisi temiz.")


if __name__ == "__main__":
    main()
