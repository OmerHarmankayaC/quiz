'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { PAKETLER } from '@/lib/bank'
import type { Paket } from '@/lib/game/types'
import { useDurum } from '@/lib/use-durum'

/**
 * Keşif ızgarası. Kapaklar tamamen kodla türetiliyor: paket başına bir koyu
 * zemin ve bir açık metin rengi yazılı, kart o ikisinden çıkıyor.
 * Filtre çipleri bu turda yok; dört pakette süs olurdu.
 */
export function PaketIzgarasi() {
  const durum = useDurum()
  const azHareket = useReducedMotion()

  return (
    <section>
      <h2 className="mb-4 text-lg tracking-tight">Paketler</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {PAKETLER.map((paket, i) => (
          <motion.div
            key={paket.slug}
            initial={azHareket ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.06,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <PaketKarti paket={paket} enIyi={durum?.paketler[paket.slug]?.enIyi} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function PaketKarti({ paket, enIyi }: { paket: Paket; enIyi?: number }) {
  const tavan = paket.soru_ids.length * 100

  return (
    <Link
      href={`/paket/${paket.slug}`}
      style={{ backgroundColor: paket.renk, color: paket.metin_rengi }}
      className="group relative flex h-full min-h-48 flex-col justify-between overflow-hidden rounded-kart p-6 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1"
    >
      {/* Renkten türeyen yumuşak ışık: kapak düz bir renk lekesi kalmasın. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-[0.14] blur-3xl transition-opacity duration-300 group-hover:opacity-25"
        style={{ backgroundColor: paket.metin_rengi }}
      />

      <div className="relative">
        <h3 className="max-w-[14ch] text-balance text-2xl leading-tight tracking-tight sm:text-3xl">
          {paket.baslik}
        </h3>
        <p className="mt-2 max-w-[28ch] text-sm opacity-70">{paket.aciklama}</p>
      </div>

      <div className="relative mt-8 flex items-end justify-between gap-4">
        <span className="rakam text-xs opacity-60">
          {paket.soru_ids.length} soru
        </span>
        {enIyi !== undefined && (
          <span className="rakam text-sm">
            {enIyi}
            <span className="opacity-60">/{tavan}</span>
          </span>
        )}
      </div>
    </Link>
  )
}
