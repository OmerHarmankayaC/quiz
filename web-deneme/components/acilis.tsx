'use client'

import { motion, useReducedMotion } from 'motion/react'
import { pecetesiniAl } from '@/lib/bank'
import { oraniBicimle } from '@/lib/game/scoring'
import type { FermiSoru, SoruSonucu } from '@/lib/game/types'
import { sayiYaz } from '@/lib/format'

/**
 * Cevap kilitlendikten sonra açılan panel. Asıl lezzet burada:
 * fermi sorusunda doğru cevap, sapma ve peçete hesabı; MCQ'da açıklama.
 * Puan yalnızca ortak para birimi olduğu için ikinci planda duruyor.
 */
export function Acilis({ sonuc }: { sonuc: SoruSonucu }) {
  const azHareket = useReducedMotion()
  const { soru, puan, oran } = sonuc

  return (
    <motion.div
      initial={azHareket ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-kart border border-cizgi bg-yuzey p-5 sm:p-6"
    >
      {soru.mode === 'fermi' ? (
        <FermiAcilisi soru={soru} oran={oran} puan={puan} />
      ) : (
        <div className="space-y-3">
          <PuanSatiri puan={puan} etiket={puan === 100 ? 'Doğru' : 'Yanlış'} />
          <p className="leading-relaxed text-solgun">{soru.explanation}</p>
        </div>
      )}
      <Kaynak metin={soru.source} />
    </motion.div>
  )
}

function FermiAcilisi({
  soru,
  oran,
  puan,
}: {
  soru: FermiSoru
  oran: number | undefined
  puan: number
}) {
  const { napkin, math, cevrilmis } = pecetesiniAl(soru)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="mb-1 text-sm text-solgun">Doğru cevap</p>
          <p className="rakam text-3xl text-metin sm:text-4xl">
            {sayiYaz(soru.answer)}{' '}
            <span className="text-lg text-solgun sm:text-xl">{soru.unit}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="mb-1 text-sm text-solgun">Sapma</p>
          <p className="rakam text-3xl text-metin sm:text-4xl">
            {oraniBicimle(oran)}
          </p>
        </div>
      </div>

      <PuanSatiri puan={puan} etiket="puan" />

      {soru.donusum && (
        <p className="text-sm text-sonuk">Kaynak birim: {soru.donusum}</p>
      )}

      {(napkin || math) && (
        <div className="rounded-kontrol bg-yuzey-2 p-4">
          <p className="mb-3 text-sm text-solgun">
            Peçete hesabı
            {!cevrilmis && (
              <span className="ml-2 text-xs text-sonuk">çeviri bekliyor</span>
            )}
          </p>
          {napkin?.lead && (
            <p className="mb-3 leading-relaxed text-solgun">{napkin.lead}</p>
          )}
          <dl className="grid gap-1.5">
            {(napkin?.rows ?? math ?? []).map(([etiket, deger], i) => (
              <div key={i} className="flex items-baseline justify-between gap-4">
                <dt className="text-sm text-solgun">{etiket}</dt>
                <dd className="rakam text-sm text-metin">{deger}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

function PuanSatiri({ puan, etiket }: { puan: number; etiket: string }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="rakam text-2xl text-metin">{puan}</span>
      <span className="text-sm text-solgun">{etiket}</span>
    </p>
  )
}

function Kaynak({ metin }: { metin: string }) {
  if (!metin) return null
  return <p className="mt-5 border-t border-cizgi pt-3 text-xs text-sonuk">{metin}</p>
}
