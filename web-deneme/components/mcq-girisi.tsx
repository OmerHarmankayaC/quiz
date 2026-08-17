'use client'

import type { McqSoru } from '@/lib/game/types'

/**
 * Dört şık. Kilitlendikten sonra doğru şık her hâlükârda işaretlenir,
 * yanlış seçim ayrıca kırmızıya döner; oyuncu neyi kaçırdığını görsün.
 */
export function McqGirisi({
  soru,
  secim,
  onSecim,
  kilitli,
}: {
  soru: McqSoru
  secim: number | null
  onSecim: (i: number) => void
  kilitli: boolean
}) {
  return (
    <div role="radiogroup" aria-label="Şıklar" className="grid gap-2">
      {soru.choices.map((sik, i) => {
        const secili = secim === i
        const dogru = i === soru.correct_index

        let stil = 'border-cizgi bg-yuzey text-metin hover:border-solgun'
        if (kilitli && dogru) {
          stil = 'border-[#7FE3A3] bg-[#7FE3A3]/10 text-[#B8F5CE]'
        } else if (kilitli && secili) {
          stil = 'border-[#FF8A73] bg-[#FF8A73]/10 text-[#FFC0B3]'
        } else if (kilitli) {
          stil = 'border-cizgi bg-yuzey text-sonuk'
        } else if (secili) {
          stil = 'border-metin bg-yuzey-2 text-metin'
        }

        return (
          <button
            key={sik}
            type="button"
            role="radio"
            aria-checked={secili}
            disabled={kilitli}
            onClick={() => onSecim(i)}
            className={`flex items-start gap-3 rounded-kontrol border p-4 text-left leading-snug transition-all duration-150 active:scale-[0.99] disabled:active:scale-100 ${stil}`}
          >
            <span className="rakam pt-px text-xs text-sonuk">
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{sik}</span>
          </button>
        )
      })}
    </div>
  )
}
