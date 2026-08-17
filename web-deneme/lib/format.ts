/** Türkçe sayı biçimleme. Saf, DOM bilmez. */

const tam = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 })
const ondalik = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 })

/** Tam sayı gruplu, küçük ondalıklar iki basamak: `1.084.170`, `0,25`. */
export function sayiYaz(n: number): string {
  if (!Number.isFinite(n)) return '-'
  return Math.abs(n) < 1000 && !Number.isInteger(n) ? ondalik.format(n) : tam.format(n)
}

const BASAMAKLAR: [number, string][] = [
  [1e15, 'katrilyon'],
  [1e12, 'trilyon'],
  [1e9, 'milyar'],
  [1e6, 'milyon'],
  [1e3, 'bin'],
]

/**
 * Kaydırac okuması gibi dar yerler için kısa hâl: `1,08 milyon`.
 * Bin altındaki sayılar olduğu gibi kalır.
 */
export function sayiKisa(n: number): string {
  if (!Number.isFinite(n)) return '-'
  for (const [esik, ad] of BASAMAKLAR) {
    if (n >= esik) {
      const deger = n / esik
      const basamak = deger < 10 ? 2 : deger < 100 ? 1 : 0
      return `${deger.toFixed(basamak).replace('.', ',')} ${ad}`
    }
  }
  return sayiYaz(n)
}

/** Kullanıcının yazdığı metni sayıya çevirir; TR ayraçlarını da kabul eder. */
export function sayiOku(metin: string): number | null {
  const temiz = metin.trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (temiz === '') return null
  const n = Number(temiz)
  return Number.isFinite(n) ? n : null
}
