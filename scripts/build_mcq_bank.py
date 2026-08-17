#!/usr/bin/env python3
"""MCQ batch dosyalarini tek bankaya birlestirir.

Uretim sirasinda dogru cevap her zaman 0. indekse yaziliyor (yazarken takip
etmesi kolay olsun diye). Burasi onlari karistirir; aksi halde oyuncu iki
soruda oruntuyu fark eder ve oyun biter.

Karistirma soru id'sinden turetilen sabit bir tohumla yapilir: ayni girdi her
zaman ayni sirayi verir, yani banka yeniden kurulunca sik sirasi degismez.

Kullanim:
    python3 scripts/build_mcq_bank.py
"""

from __future__ import annotations

import hashlib
import json
import random
import sys
from pathlib import Path

KOK = Path(__file__).resolve().parent.parent
BATCH_DIZINI = KOK / "data" / "work"
BANKA = KOK / "data" / "bank" / "mcq.json"

ZORUNLU = {"prompt", "choices", "correct_index", "explanation", "kaynak_id", "kaynak_baslik"}


def karistir(secenekler: list[str], dogru: int, tohum: str) -> tuple[list[str], int]:
    """Siklari id'den turetilen sabit tohumla karistirir."""
    rng = random.Random(hashlib.sha256(tohum.encode()).hexdigest())
    dogru_metin = secenekler[dogru]
    yeni = secenekler[:]
    rng.shuffle(yeni)
    return yeni, yeni.index(dogru_metin)


def main() -> None:
    dosyalar = sorted(BATCH_DIZINI.glob("mcq-batch-*.json"))
    if not dosyalar:
        sys.exit(f"batch dosyasi yok: {BATCH_DIZINI}/mcq-batch-*.json")

    banka: list[dict] = []
    gorulen_prompt: set[str] = set()
    atlanan = 0

    for dosya in dosyalar:
        kayitlar = json.loads(dosya.read_text(encoding="utf-8"))
        for ham in kayitlar:
            eksik = ZORUNLU - set(ham)
            if eksik:
                sys.exit(f"{dosya.name}: eksik alan {sorted(eksik)} -> {ham.get('prompt', '?')[:60]}")

            anahtar = ham["prompt"].strip().lower()
            if anahtar in gorulen_prompt:
                atlanan += 1
                continue
            gorulen_prompt.add(anahtar)

            sira = len(banka) + 1
            qid = f"m{sira:04d}"
            secenekler, dogru = karistir(ham["choices"], ham["correct_index"], qid)

            banka.append(
                {
                    "id": qid,
                    "mode": "mcq",
                    "prompt": ham["prompt"],
                    "choices": secenekler,
                    "correct_index": dogru,
                    "explanation": ham["explanation"],
                    "topics": ham.get("topics", []),
                    "difficulty": ham.get("difficulty", 2),
                    "origin": "wiki",
                    "source": f"Vikipedi: {ham['kaynak_baslik']}",
                    "kaynak_id": ham["kaynak_id"],
                    "kaynak_baslik": ham["kaynak_baslik"],
                }
            )

    BANKA.parent.mkdir(parents=True, exist_ok=True)
    BANKA.write_text(json.dumps(banka, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    dagilim = {i: sum(1 for b in banka if b["correct_index"] == i) for i in range(4)}
    print(f"{len(dosyalar)} batch -> {BANKA.relative_to(KOK)}: {len(banka)} soru")
    if atlanan:
        print(f"  {atlanan} tekrar eden soru atlandi")
    print(f"  dogru cevap indeks dagilimi: {dagilim}")


if __name__ == "__main__":
    main()
