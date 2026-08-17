/**
 * Takvimden bugünün bulmacasını çözer. Saat dilimi burada ele alınır,
 * başka hiçbir dosya tarih hesabı yapmaz. Saf: dosya okumaz, ağa çıkmaz.
 */

import type { TakvimGunu } from './types'

export const SAAT_DILIMI = 'Europe/Istanbul'

/**
 * Verilen anın Europe/Istanbul'daki takvim gününü `YYYY-MM-DD` olarak verir.
 * Gün sınırı yerel gece yarısı: 23:59 dünün, 00:01 bugünün.
 */
export function bugununTarihi(an: Date = new Date()): string {
  // en-CA zaten YYYY-MM-DD üretir; parça birleştirmeye gerek yok.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SAAT_DILIMI,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(an)
}

/** Takvimde o tarihe yazılmış günü döndürür; yoksa null. */
export function gunuBul(takvim: TakvimGunu[], tarih: string): TakvimGunu | null {
  return takvim.find((g) => g.tarih === tarih) ?? null
}

export function bugununBulmacasi(
  takvim: TakvimGunu[],
  an: Date = new Date(),
): TakvimGunu | null {
  return gunuBul(takvim, bugununTarihi(an))
}

/** Arşiv listesi: bugüne kadar açılmış günler, en yeni başta. */
export function gecmisGunler(
  takvim: TakvimGunu[],
  an: Date = new Date(),
): TakvimGunu[] {
  const bugun = bugununTarihi(an)
  return takvim
    .filter((g) => g.tarih <= bugun)
    .sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
}

/** `17 Ağustos 2026` biçimi. */
const AYLAR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
]

export function tarihiYaz(tarih: string): string {
  const [yil, ay, gun] = tarih.split('-')
  const ayAdi = AYLAR[Number(ay) - 1]
  if (!ayAdi) return tarih
  return `${Number(gun)} ${ayAdi} ${yil}`
}
