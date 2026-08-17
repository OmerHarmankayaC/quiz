'use client'

import Link from 'next/link'
import { FlameIcon } from '@phosphor-icons/react/dist/ssr'
import { bugununTarihi } from '@/lib/game/daily'
import { useDurum } from '@/lib/use-durum'

/** Tek satır, 64px. Solda ad, sağda seri ve arşiv. */
export function UstCubuk() {
  const durum = useDurum()
  const bugun = bugununTarihi()

  // Seri ancak dün ya da bugün oynanmışsa canlı; eskimiş seri gösterilmez.
  const seri = durum?.seri
  const dun = new Date(Date.parse(`${bugun}T00:00:00Z`) - 86400000)
    .toISOString()
    .slice(0, 10)
  const canli = seri && (seri.sonTarih === bugun || seri.sonTarih === dun)

  return (
    <header className="flex h-16 items-center justify-between gap-4">
      <Link href="/" className="text-lg font-medium tracking-tight">
        Kaç?
      </Link>
      <nav className="flex items-center gap-5 text-sm">
        {canli && (
          <span
            className="flex items-center gap-1.5 text-solgun"
            title={`${seri.sayi} gündür üst üste oynuyorsun`}
          >
            <FlameIcon size={15} weight="fill" />
            <span className="rakam text-metin">{seri.sayi}</span>
          </span>
        )}
        <Link
          href="/arsiv"
          className="text-solgun transition-colors hover:text-metin"
        >
          Arşiv
        </Link>
      </nav>
    </header>
  )
}
