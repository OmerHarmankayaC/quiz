#!/usr/bin/env python3
"""Triage tablosu + ham fermi.gg verisinden TR Fermi bankasini kurar.

Ceviri tablosu (data/work/fermi-triage.json) yalnizca METIN tasir: TR soru,
TR birim, konu, zorluk. Sayisal alanlar (answer, source) ham veriden gelir.
Boylece elle ceviri sirasinda bir rakamin yanlis kopyalanmasi mumkun degil.

Uc kova:
  t (translated) -> evrensel soru, cevap ham veriden aynen gelir     -> bankaya
  a (adapted)    -> TR baglamina tasindi, cevap ARTIK GECERSIZ       -> pending
  x (dropped)    -> TR oyuncusu tahmin zinciri kuramaz               -> atilir

Uyarlanan sorularin cevabi yeniden arastirilmadan bankaya girmez; bunlar
ayri bir bekleme dosyasina yazilir.

Kullanim:
    python3 scripts/build_fermi_bank.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
HAM = KOK / "data" / "raw" / "questions.json"
TRIAGE = KOK / "data" / "work" / "fermi-triage.json"
BANKA = KOK / "data" / "bank" / "fermi.json"
BEKLEYEN = KOK / "data" / "work" / "fermi-adapted-pending.json"

DOGRULAMA_TARIHI = "2026-08"

# Imperial -> metrik. fermi.gg cevaplari ABD birimlerinde; TR oyuncusu icin
# metrige cevriliyor ve cevap da ayni oranda donusturuluyor.
DONUSUM = {
    "ft_m": (0.3048, "feet -> metre"),
    "mi_km": (1.609344, "mil -> kilometre"),
    "lb_kg": (0.453592, "pound -> kilogram"),
    "gal_l": (3.785412, "galon -> litre"),
    "mph_kmh": (1.609344, "mil/sa -> km/sa"),
}


def anlamli_yuvarla(x: float, basamak: int = 2) -> float:
    """Donusum sonrasi sahte hassasiyeti temizler: 1483 ft -> 452 m, 452.03 degil."""
    if x == 0:
        return 0
    from math import floor, log10

    us = floor(log10(abs(x)))
    yuvarlanmis = round(x, -(us - basamak + 1))
    return int(yuvarlanmis) if yuvarlanmis == int(yuvarlanmis) else yuvarlanmis


def main() -> None:
    ham = {q["id"]: q for q in json.loads(HAM.read_text(encoding="utf-8"))}
    triage = json.loads(TRIAGE.read_text(encoding="utf-8"))
    triage.pop("_aciklama", None)

    eksik = set(triage) - set(ham)
    if eksik:
        sys.exit(f"triage'da ham veride olmayan id var: {sorted(eksik)}")
    atlanan = set(ham) - set(triage)
    if atlanan:
        print(f"uyari: triage'da karar verilmemis {len(atlanan)} soru atlandi", file=sys.stderr)

    banka, bekleyen = [], []
    sayac = {"t": 0, "a": 0, "x": 0}
    sira = 0

    for qid, karar in triage.items():
        k = karar["k"]
        sayac[k] += 1
        if k == "x":
            continue

        h = ham[qid]
        cevap = h["answer"]
        donusum_notu = None

        if conv := karar.get("conv"):
            if conv not in DONUSUM:
                sys.exit(f"{qid}: bilinmeyen donusum '{conv}'")
            carpan, aciklama = DONUSUM[conv]
            cevap = anlamli_yuvarla(cevap * carpan)
            donusum_notu = f"{h['answer']} {h['unit']} ({aciklama})"

        kayit = {
            "mode": "fermi",
            "prompt": karar["p"],
            "unit": karar["u"],
            "topics": karar["t"],
            "difficulty": karar["d"],
            "source": h.get("source"),
            "kaynak_soru": qid,
        }

        if k == "a":
            # Cevap TR baglaminda gecersiz; arastirilip doldurulacak.
            kayit["answer"] = None
            kayit["origin"] = "adapted"
            kayit["orijinal_soru"] = h["prompt"]
            kayit["orijinal_cevap"] = f"{h['answer']} {h['unit']}"
            kayit["durum"] = "cevap_bekliyor"
            bekleyen.append(kayit)
            continue

        sira += 1
        kayit["id"] = f"f{sira:04d}"
        kayit["answer"] = cevap
        kayit["origin"] = "translated"
        kayit["verified_at"] = DOGRULAMA_TARIHI
        if donusum_notu:
            kayit["donusum"] = donusum_notu
        # Adim adim cozum ve tahmin zinciri henuz cevrilmedi; veri kaybolmasin
        # diye orijinal haliyle tasiniyor.
        if h.get("math"):
            kayit["_math_en"] = h["math"]
        if h.get("napkin"):
            kayit["_napkin_en"] = h["napkin"]

        # Alan sirasi okunabilir olsun diye id one aliniyor.
        banka.append({"id": kayit.pop("id"), **kayit})

    BANKA.parent.mkdir(parents=True, exist_ok=True)
    BANKA.write_text(json.dumps(banka, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    BEKLEYEN.write_text(json.dumps(bekleyen, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"triage: {sayac['t']} cevrildi, {sayac['a']} uyarlandi, {sayac['x']} elendi")
    print(f"  {BANKA.relative_to(KOK)}    -> {len(banka)} soru (oynanabilir)")
    print(f"  {BEKLEYEN.relative_to(KOK)} -> {len(bekleyen)} soru (cevap arastirmasi bekliyor)")

    donusenler = [b for b in banka if "donusum" in b]
    if donusenler:
        print(f"\nbirim donusumu yapilan {len(donusenler)} soru:")
        for b in donusenler:
            print(f"  {b['id']} {b['answer']:>10} {b['unit']:<12} <- {b['donusum']}")


if __name__ == "__main__":
    main()
