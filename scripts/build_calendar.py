#!/usr/bin/env python3
"""Gunluk bulmaca takvimini uretir -> data/bank/calendar.json

Takvim calisma zamaninda tarihten hash turetilerek degil, derleme aninda
dosyaya yazilarak uretilir: herkeste ayni, gozle denetlenebilir, tekrar
kontrolu burada yapilir.

Kurallar:
  - Gunde 3 soru: 2 fermi + 1 mcq. Fermi cogunlukta cunku oyunun imzasi o;
    mcq gunu cesitlendirir.
  - Paketlerde kullanilan sorular takvime girmez. Oyuncu ayni soruyu iki
    farkli yerde gormemeli.
  - Bir soru takvimde yalnizca bir kez cikar.
  - Ayni gunun uc sorusu ayni konudan olmaz.
  - YAYIMLANMIS GUNLER ASLA DEGISMEZ: mevcut calendar.json okunur, oradaki
    gunler oldugu gibi korunur, yalnizca sonuna yeni gun eklenir. Aksi halde
    dun oynanan bulmaca bugun baska bir soru gosterirdi.

Saat dilimi Europe/Istanbul; burada yalnizca tarih dizisi uretildigi icin
gun siniri arayuz tarafinda ele alinir.

Kullanim:
    python3 scripts/build_calendar.py [--baslangic 2026-08-17] [--gun 60]
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BANK = KOK / "data" / "bank"
CIKTI = BANK / "calendar.json"

FERMI_PER_GUN = 2
MCQ_PER_GUN = 1


def zorluk_kovalari(sorular: list[dict]) -> dict[int, list[dict]]:
    kovalar: dict[int, list[dict]] = defaultdict(list)
    for s in sorular:
        kovalar[s["difficulty"]].append(s)
    for z in kovalar:
        kovalar[z].sort(key=lambda s: s["id"])
    return kovalar


def sirayla_cek(kovalar: dict[int, list[dict]], sira: list[int], yasak_konular: set[str]):
    """Zorluk kovalarindan sirayla bir soru ceker; gunun konusuyla cakisani atlar."""
    for z in sira:
        kova = kovalar.get(z) or []
        for i, aday in enumerate(kova):
            if not (set(aday["topics"]) & yasak_konular):
                return kova.pop(i)
    # Konu cakismasi kacinilmazsa dolu ilk kovadan al - gun bos kalmasin.
    for z in sira:
        if kovalar.get(z):
            return kovalar[z].pop(0)
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--baslangic", default=date.today().isoformat(),
                    help="ilk gun (YYYY-MM-DD), varsayilan bugun")
    ap.add_argument("--gun", type=int, default=0,
                    help="uretilecek gun sayisi; 0 = havuz bitene kadar")
    args = ap.parse_args()

    fermi = json.loads((BANK / "fermi.json").read_text(encoding="utf-8"))
    mcq = json.loads((BANK / "mcq.json").read_text(encoding="utf-8"))
    paketler = json.loads((BANK / "packs.json").read_text(encoding="utf-8"))

    paket_sorulari = {qid for p in paketler for qid in p["soru_ids"]}

    mevcut = []
    if CIKTI.exists():
        mevcut = json.loads(CIKTI.read_text(encoding="utf-8"))
    kullanilan = {qid for gun in mevcut for qid in gun["soru_ids"]}

    # Havuz: pakette olmayan ve daha once takvime girmemis sorular.
    dislanan = paket_sorulari | kullanilan
    f_kovalar = zorluk_kovalari([s for s in fermi if s["id"] not in dislanan])
    m_kovalar = zorluk_kovalari([s for s in mcq if s["id"] not in dislanan])

    f_kalan = sum(len(v) for v in f_kovalar.values())
    m_kalan = sum(len(v) for v in m_kovalar.values())
    mumkun = min(f_kalan // FERMI_PER_GUN, m_kalan // MCQ_PER_GUN)
    uretilecek = mumkun if args.gun == 0 else min(args.gun, mumkun)

    if mevcut:
        son = date.fromisoformat(mevcut[-1]["tarih"])
        ilk_gun = son + timedelta(days=1)
        sonraki_no = mevcut[-1]["no"] + 1
        print(f"mevcut takvim: {len(mevcut)} gun ({mevcut[0]['tarih']} - {mevcut[-1]['tarih']}), korunuyor")
    else:
        ilk_gun = date.fromisoformat(args.baslangic)
        sonraki_no = 1

    yeni = []
    # Zorluk sirasi her gun kayar: bulmacalar tek tip zorlukta olmasin.
    siralar = [[2, 1, 3], [1, 3, 2], [3, 2, 1]]

    for i in range(uretilecek):
        gun_konulari: set[str] = set()
        secim = []
        sira = siralar[(sonraki_no + i) % 3]

        for _ in range(FERMI_PER_GUN):
            s = sirayla_cek(f_kovalar, sira, gun_konulari)
            if s is None:
                break
            secim.append(s)
            gun_konulari |= set(s["topics"])

        for _ in range(MCQ_PER_GUN):
            s = sirayla_cek(m_kovalar, sira, gun_konulari)
            if s is None:
                break
            secim.append(s)

        if len(secim) < FERMI_PER_GUN + MCQ_PER_GUN:
            break

        yeni.append({
            "tarih": (ilk_gun + timedelta(days=i)).isoformat(),
            "no": sonraki_no + i,
            "soru_ids": [s["id"] for s in secim],
        })

    takvim = mevcut + yeni
    CIKTI.write_text(json.dumps(takvim, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Dogrulama: tekrar eden soru olmamali.
    tum = [qid for gun in takvim for qid in gun["soru_ids"]]
    tekrar = {q for q in tum if tum.count(q) > 1}
    cakisma = set(tum) & paket_sorulari

    print(f"{len(yeni)} yeni gun eklendi -> {CIKTI.relative_to(KOK)}")
    if takvim:
        print(f"  takvim: {takvim[0]['tarih']} - {takvim[-1]['tarih']} ({len(takvim)} gun, {len(tum)} soru)")
    print(f"  havuzda kalan: {sum(len(v) for v in f_kovalar.values())} fermi, "
          f"{sum(len(v) for v in m_kovalar.values())} mcq")
    if tekrar:
        print(f"  HATA: takvimde tekrar eden soru -> {sorted(tekrar)}")
    if cakisma:
        print(f"  HATA: paketle cakisan soru -> {sorted(cakisma)}")


if __name__ == "__main__":
    main()
