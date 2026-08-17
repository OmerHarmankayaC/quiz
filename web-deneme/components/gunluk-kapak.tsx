'use client'

import Link from 'next/link'
import { bugununBulmacasi, tarihiYaz } from '@/lib/game/daily'
import { TAKVIM } from '@/lib/bank'
import { useDurum } from '@/lib/use-durum'

/**
 * Ana ekranın üst bloğu. Günlük alışkanlık kaydırma insafına bırakılmasın
 * diye tam genişlikte ve ilk ekranda duruyor.
 */
export function GunlukKapak() {
  const durum = useDurum()
  const bugun = bugununBulmacasi(TAKVIM)

  if (!bugun) return <TakvimBitti />

  const puan = durum?.gunluk[bugun.tarih]
  const oynandi = puan !== undefined

  return (
    <section className="relative overflow-hidden rounded-kart border border-cizgi bg-yuzey">
      {/* Dev numara kapak sanatının kendisi: görsel üretmeden ölçeklenir. */}
      <span
        aria-hidden
        className="rakam pointer-events-none absolute -bottom-6 right-4 select-none text-[8rem] leading-none text-white/[0.04] sm:-bottom-10 sm:right-10 sm:text-[13rem]"
      >
        {bugun.no}
      </span>

      <div className="relative p-6 sm:p-10">
        <p className="rakam mb-6 text-sm text-sonuk">
          No. {bugun.no} · {tarihiYaz(bugun.tarih)}
        </p>
        <h1 className="max-w-md text-balance text-3xl leading-tight tracking-tight sm:text-5xl">
          {oynandi ? 'Bugünü bitirdin.' : 'Bugün üç soru var.'}
        </h1>
        <p className="mt-3 max-w-sm text-solgun">
          Bir büyüklük tahmini, iki bilgi sorusu.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/gunluk"
            className="rounded-kontrol bg-metin px-6 py-3 font-medium text-zemin transition-transform active:scale-[0.99]"
          >
            {oynandi ? 'Tekrar oyna' : 'Oyna'}
          </Link>
          {oynandi && (
            <p className="rakam text-sm text-solgun">
              <span className="text-metin">{puan}</span>/300
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function TakvimBitti() {
  return (
    <section className="rounded-kart border border-cizgi bg-yuzey p-6 sm:p-10">
      <h1 className="text-3xl leading-tight tracking-tight sm:text-4xl">
        Takvim burada bitiyor.
      </h1>
      <p className="mt-3 max-w-sm text-solgun">
        Bugüne yazılmış bir bulmaca yok. Paketler duruyor, arşiv de açık.
      </p>
      <Link
        href="/arsiv"
        className="mt-8 inline-block rounded-kontrol border border-cizgi px-6 py-3 font-medium transition-colors hover:border-solgun"
      >
        Arşive git
      </Link>
    </section>
  )
}
