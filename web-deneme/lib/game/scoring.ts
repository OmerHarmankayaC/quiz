/**
 * Oran ve puan. Saf: soru şemasını bilir, React'i ve DOM'u bilmez.
 *
 * fermi.gg skoru ham bir oran olarak tutar (düşük iyi). Biz onu 0-100 puana
 * çeviriyoruz, çünkü çoktan seçmeli soruyla aynı para birimine girmesi gerek.
 */

import type { FermiSoru, McqSoru, Soru, SoruSonucu, Yanit } from './types'

/** log10(oran) bu değere ulaştığında puan sıfırlanır: 10^2 = 100x sapma. */
const SIFIR_ESIGI_LOG = 2

/**
 * max(tahmin, cevap) / min(tahmin, cevap). Düşük iyi, en iyi 1.
 * Geçersiz tahmin (sıfır, negatif, NaN, Infinity) sonsuz oran verir.
 */
export function oranHesapla(tahmin: number, cevap: number): number {
  if (!Number.isFinite(tahmin) || tahmin <= 0) return Infinity
  if (!Number.isFinite(cevap) || cevap <= 0) return Infinity
  return Math.max(tahmin, cevap) / Math.min(tahmin, cevap)
}

function kis(deger: number, alt: number, ust: number): number {
  return Math.min(ust, Math.max(alt, deger))
}

/** Orandan puan: 1x -> 100, 10x -> 50, 100x ve ötesi -> 0. */
export function orandanPuan(oran: number): number {
  if (!Number.isFinite(oran)) return 0
  if (oran < 1) return 0
  return Math.round(100 * kis(1 - Math.log10(oran) / SIFIR_ESIGI_LOG, 0, 1))
}

export function fermiPuani(tahmin: number, cevap: number): number {
  return orandanPuan(oranHesapla(tahmin, cevap))
}

export function mcqPuani(secim: number, dogruIndeks: number): number {
  return secim === dogruIndeks ? 100 : 0
}

/** Tek sorunun yanıtını puanlar. Yanıt tipi soru tipiyle eşleşmezse 0 puan. */
export function soruyuPuanla(soru: Soru, yanit: Yanit): SoruSonucu {
  if (soru.mode === 'fermi' && yanit.mode === 'fermi') {
    const oran = oranHesapla(yanit.tahmin, (soru as FermiSoru).answer)
    return { soru, yanit, puan: orandanPuan(oran), oran }
  }
  if (soru.mode === 'mcq' && yanit.mode === 'mcq') {
    return {
      soru,
      yanit,
      puan: mcqPuani(yanit.secim, (soru as McqSoru).correct_index),
    }
  }
  return { soru, yanit, puan: 0 }
}

export function toplamPuan(sonuclar: SoruSonucu[]): number {
  return sonuclar.reduce((acc, s) => acc + s.puan, 0)
}

/** Paket/günlük tavanı: soru başına 100. */
export function maksimumPuan(soruSayisi: number): number {
  return soruSayisi * 100
}

/** Sonuç ekranındaki `1.34x` biçimi. Sonsuz oran tire ile gösterilir. */
export function oraniBicimle(oran: number | undefined): string {
  if (oran === undefined || !Number.isFinite(oran)) return '-'
  return `${oran.toFixed(2)}x`
}
