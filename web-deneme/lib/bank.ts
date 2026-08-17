/**
 * Banka erişimi. JSON dosyaları derleme anında bundle'a girer, çalışma
 * zamanında ağ isteği yok. Soru şeması bilgisi burada bitmez, `types.ts`'te
 * durur; bu dosya yalnızca yükleyip indeksler.
 */

import fermiHam from '@/data/bank/fermi.json'
import mcqHam from '@/data/bank/mcq.json'
import paketlerHam from '@/data/bank/packs.json'
import takvimHam from '@/data/bank/calendar.json'
import type { FermiSoru, McqSoru, Paket, Soru, TakvimGunu } from './game/types'

/** Kaydıraç bandı build-data.mjs tarafından eklenir. */
export type BankaFermi = FermiSoru & { alt_us: number; ust_us: number }

export const FERMI = fermiHam as unknown as BankaFermi[]
export const MCQ = mcqHam as unknown as McqSoru[]
export const PAKETLER = paketlerHam as unknown as Paket[]
export const TAKVIM = takvimHam as unknown as TakvimGunu[]

const indeks = new Map<string, Soru>()
for (const s of [...FERMI, ...MCQ]) indeks.set(s.id, s)

export function soruyuBul(id: string): Soru | null {
  return indeks.get(id) ?? null
}

/** Kimlik listesini soruya çevirir; bankada olmayan kimlikler sessizce düşer. */
export function sorulariTopla(ids: string[]): Soru[] {
  return ids.map(soruyuBul).filter((s): s is Soru => s !== null)
}

export function paketiBul(slug: string): Paket | null {
  return PAKETLER.find((p) => p.slug === slug) ?? null
}

/** Peçete hesabı: Türkçesi varsa o, yoksa henüz çevrilmemiş kaynak. */
export function pecetesiniAl(soru: FermiSoru) {
  const napkin = soru.napkin ?? soru._napkin_en
  const math = soru.math ?? soru._math_en
  const cevrilmis = Boolean(soru.napkin ?? soru.math)
  return { napkin, math, cevrilmis }
}
