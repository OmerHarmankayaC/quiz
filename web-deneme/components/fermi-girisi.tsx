'use client'

import { useId, useState } from 'react'
import type { BankaFermi } from '@/lib/bank'
import { sayiKisa, sayiOku, sayiYaz } from '@/lib/format'

/**
 * Logaritmik kaydıraç + eşzamanlı yazılı giriş.
 *
 * Kaydıraç büyüklük sezgisini verir (bir kademe = 0,1 ondalık basamak),
 * klavye kesinliği verir. İkisi tek değeri paylaşır: `deger` tek doğruluk
 * kaynağı, kaydıraç kademesi ondan türer.
 */

/** 10^x çirkin sayılar üretir; iki anlamlı basamağa yuvarlayınca okunur olur. */
function anlamliYuvarla(n: number): number {
  if (n <= 0) return n
  const buyukluk = Math.floor(Math.log10(n)) - 1
  const carpan = Math.pow(10, buyukluk)
  return Math.round(n / carpan) * carpan
}

export function FermiGirisi({
  soru,
  deger,
  onDegisim,
  kilitli,
}: {
  soru: BankaFermi
  deger: number
  onDegisim: (yeni: number) => void
  kilitli: boolean
}) {
  const alanId = useId()
  const [metin, setMetin] = useState<string | null>(null)

  const kademeSayisi = (soru.ust_us - soru.alt_us) * 10
  const kademe = Math.min(
    kademeSayisi,
    Math.max(0, Math.round((Math.log10(deger) - soru.alt_us) * 10)),
  )

  function kaydiracDegisti(yeniKademe: number) {
    const yeni = anlamliYuvarla(Math.pow(10, soru.alt_us + yeniKademe / 10))
    setMetin(null)
    onDegisim(yeni)
  }

  function yaziDegisti(girdi: string) {
    setMetin(girdi)
    const okunan = sayiOku(girdi)
    if (okunan !== null && okunan > 0) onDegisim(okunan)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <label
            htmlFor={alanId}
            className="mb-2 block text-sm text-solgun"
          >
            Tahminin
          </label>
          <div className="flex items-baseline gap-2">
            <input
              id={alanId}
              type="text"
              inputMode="decimal"
              disabled={kilitli}
              value={metin ?? sayiYaz(deger)}
              onChange={(e) => yaziDegisti(e.target.value)}
              onBlur={() => setMetin(null)}
              aria-describedby={`${alanId}-birim`}
              className="rakam w-[7ch] min-w-0 border-b-2 border-cizgi bg-transparent pb-1 text-3xl text-metin transition-colors focus:border-metin focus:outline-none disabled:opacity-60 sm:w-[11ch] sm:text-4xl"
            />
            <span id={`${alanId}-birim`} className="text-lg text-solgun">
              {soru.unit}
            </span>
          </div>
        </div>
        <p className="rakam pb-2 text-right text-sm text-sonuk">
          {sayiKisa(deger)}
        </p>
      </div>

      <div>
        <input
          type="range"
          className="kaydirac"
          min={0}
          max={kademeSayisi}
          step={1}
          value={kademe}
          disabled={kilitli}
          onChange={(e) => kaydiracDegisti(Number(e.target.value))}
          aria-label="Büyüklük kaydıracı"
          aria-valuetext={`${sayiKisa(deger)} ${soru.unit}`}
        />
        <div className="rakam mt-1 flex justify-between text-xs text-sonuk">
          <span>{sayiKisa(Math.pow(10, soru.alt_us))}</span>
          <span>{sayiKisa(Math.pow(10, soru.ust_us))}</span>
        </div>
      </div>
    </div>
  )
}

/** Kaydıracın açılış değeri: bandın ortası, hiçbir yöne ipucu vermez. */
export function baslangicDegeri(soru: BankaFermi): number {
  return anlamliYuvarla(Math.pow(10, (soru.alt_us + soru.ust_us) / 2))
}
