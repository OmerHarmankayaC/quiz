/**
 * localStorage'ın tek kapısı. Başka hiçbir dosya doğrudan dokunmaz.
 *
 * Depo dışarıdan verilebilir; testler sahte bir Storage geçirir, tarayıcı
 * varsayılanı kullanır. Depo yoksa (SSR, statik render) okuma varsayılanı
 * döndürür, yazma sessizce düşer.
 */

import type { OyunSonucu } from './types'

const ANAHTAR = 'kac.durum.v1'
const SON_SONUC_ANAHTARI = 'kac.sonSonuc.v1'

export type Seri = { sonTarih: string; sayi: number }

export type PaketKaydi = { enIyi: number; tamamlandi: string }

export type Durum = {
  seri: Seri | null
  /** tarih -> o günün puanı */
  gunluk: Record<string, number>
  /** paket slug -> en iyi skor */
  paketler: Record<string, PaketKaydi>
}

export const BOS_DURUM: Durum = { seri: null, gunluk: {}, paketler: {} }

function depoyuBul(depo?: Storage): Storage | null {
  if (depo) return depo
  try {
    return globalThis.localStorage ?? null
  } catch {
    // Bazı tarayıcılar üçüncü taraf bağlamda localStorage erişimini fırlatır.
    return null
  }
}

/** Bilinmeyen bir değeri Durum'a indirger; her alan tek tek doğrulanır. */
function durumuAyikla(ham: unknown): Durum {
  if (typeof ham !== 'object' || ham === null) return BOS_DURUM
  const o = ham as Record<string, unknown>

  let seri: Seri | null = null
  const s = o.seri
  if (
    typeof s === 'object' &&
    s !== null &&
    typeof (s as Seri).sonTarih === 'string' &&
    Number.isFinite((s as Seri).sayi)
  ) {
    seri = { sonTarih: (s as Seri).sonTarih, sayi: (s as Seri).sayi }
  }

  const gunluk: Record<string, number> = {}
  if (typeof o.gunluk === 'object' && o.gunluk !== null) {
    for (const [tarih, puan] of Object.entries(o.gunluk as object)) {
      if (typeof puan === 'number' && Number.isFinite(puan)) gunluk[tarih] = puan
    }
  }

  const paketler: Record<string, PaketKaydi> = {}
  if (typeof o.paketler === 'object' && o.paketler !== null) {
    for (const [slug, kayit] of Object.entries(o.paketler as object)) {
      if (
        typeof kayit === 'object' &&
        kayit !== null &&
        Number.isFinite((kayit as PaketKaydi).enIyi)
      ) {
        paketler[slug] = {
          enIyi: (kayit as PaketKaydi).enIyi,
          tamamlandi: String((kayit as PaketKaydi).tamamlandi ?? ''),
        }
      }
    }
  }

  return { seri, gunluk, paketler }
}

export function durumuOku(depo?: Storage): Durum {
  const d = depoyuBul(depo)
  if (!d) return BOS_DURUM
  try {
    const ham = d.getItem(ANAHTAR)
    if (!ham) return BOS_DURUM
    return durumuAyikla(JSON.parse(ham))
  } catch {
    // Bozuk JSON: oyun sıfırdan başlar, çökmez.
    return BOS_DURUM
  }
}

export function durumuYaz(durum: Durum, depo?: Storage): void {
  const d = depoyuBul(depo)
  if (!d) return
  try {
    d.setItem(ANAHTAR, JSON.stringify(durum))
  } catch {
    // Kota dolu ya da özel mod: kayıt yoksa oyun yine oynanır.
  }
}

/** `YYYY-MM-DD` üzerinde gün aritmetiği. Saf tarih olduğu için UTC güvenli. */
function gunEkle(tarih: string, fark: number): string {
  const [y, a, g] = tarih.split('-').map(Number)
  const t = new Date(Date.UTC(y, a - 1, g + fark))
  return t.toISOString().slice(0, 10)
}

/**
 * Seri kuralı: ardışık gün +1, atlanan gün 1'e döndürür,
 * aynı günü tekrar oynamak seriyi büyütmez.
 */
export function seriyiGuncelle(mevcut: Seri | null, tarih: string): Seri {
  if (!mevcut) return { sonTarih: tarih, sayi: 1 }
  if (mevcut.sonTarih === tarih) return mevcut
  if (mevcut.sonTarih === gunEkle(tarih, -1)) {
    return { sonTarih: tarih, sayi: mevcut.sayi + 1 }
  }
  return { sonTarih: tarih, sayi: 1 }
}

/** Günlük bulmaca bitti: seri ilerler, o günün puanı yazılır. */
export function gunlukSonucuKaydet(
  tarih: string,
  puan: number,
  depo?: Storage,
): Durum {
  const mevcut = durumuOku(depo)
  const oncekiPuan = mevcut.gunluk[tarih]
  const yeni: Durum = {
    ...mevcut,
    seri: seriyiGuncelle(mevcut.seri, tarih),
    gunluk: {
      ...mevcut.gunluk,
      // Aynı günü tekrar oynamak skoru düşürmez.
      [tarih]: oncekiPuan === undefined ? puan : Math.max(oncekiPuan, puan),
    },
  }
  durumuYaz(yeni, depo)
  return yeni
}

/** Paket bitti: yalnızca daha iyi skor eskisini ezer. */
export function paketSonucuKaydet(
  slug: string,
  puan: number,
  zaman: string,
  depo?: Storage,
): Durum {
  const mevcut = durumuOku(depo)
  const onceki = mevcut.paketler[slug]
  if (onceki && onceki.enIyi >= puan) return mevcut

  const yeni: Durum = {
    ...mevcut,
    paketler: { ...mevcut.paketler, [slug]: { enIyi: puan, tamamlandi: zaman } },
  }
  durumuYaz(yeni, depo)
  return yeni
}

/**
 * Sonuç ekranı ayrı bir rota olduğu için son oyun sessionStorage'da taşınır.
 * Sekme kapanınca gitmesi doğru davranış: sonuç kalıcı bir kayıt değil.
 */
function oturumDeposu(depo?: Storage): Storage | null {
  if (depo) return depo
  try {
    return globalThis.sessionStorage ?? null
  } catch {
    return null
  }
}

export function sonSonucuYaz(sonuc: OyunSonucu, depo?: Storage): void {
  const d = oturumDeposu(depo)
  if (!d) return
  try {
    d.setItem(SON_SONUC_ANAHTARI, JSON.stringify(sonuc))
  } catch {
    // Yazamazsak sonuç ekranı boş açılır, oyun çökmez.
  }
}

export function sonSonucuOku(depo?: Storage): OyunSonucu | null {
  const d = oturumDeposu(depo)
  if (!d) return null
  try {
    const ham = d.getItem(SON_SONUC_ANAHTARI)
    if (!ham) return null
    const cozulmus = JSON.parse(ham) as OyunSonucu
    if (!Array.isArray(cozulmus?.sonuclar)) return null
    return cozulmus
  } catch {
    return null
  }
}
