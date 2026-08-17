'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { CheckIcon, CopyIcon } from '@phosphor-icons/react/dist/ssr'
import { Yukleniyor } from '@/components/yukleniyor'
import { tarihiYaz } from '@/lib/game/daily'
import { oraniBicimle } from '@/lib/game/scoring'
import { paylasimMetni } from '@/lib/game/share'
import { sonSonucuOku } from '@/lib/game/storage'
import type { OyunSonucu, SoruSonucu } from '@/lib/game/types'
import { sayiYaz } from '@/lib/format'

/**
 * Soru soru döküm ve panoya paylaşım. Sonuç kalıcı bir kayıt değil, son
 * oynanan oyunun görüntüsü; oturum deposundan okunur.
 */
export default function SonucEkrani() {
  const [durum, setDurum] = useState<'bekliyor' | 'var' | 'yok'>('bekliyor')
  const [sonuc, setSonuc] = useState<OyunSonucu | null>(null)

  useEffect(() => {
    const okunan = sonSonucuOku()
    setSonuc(okunan)
    setDurum(okunan ? 'var' : 'yok')
  }, [])

  if (durum === 'bekliyor') return <Yukleniyor />
  if (durum === 'yok' || !sonuc) return <SonucYok />

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-20 pt-5 sm:px-6">
      <Ozet sonuc={sonuc} />

      <ol className="mt-10 grid gap-2">
        {sonuc.sonuclar.map((s, i) => (
          <SonucSatiri key={s.soru.id} sonuc={s} sira={i} />
        ))}
      </ol>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <KopyalaDugmesi metin={paylasimMetni(sonuc)} />
        <Link
          href="/"
          className="rounded-kontrol border border-cizgi px-6 py-3.5 text-center font-medium transition-colors hover:border-solgun"
        >
          Ana ekran
        </Link>
      </div>
    </div>
  )
}

function Ozet({ sonuc }: { sonuc: OyunSonucu }) {
  const azHareket = useReducedMotion()

  return (
    <motion.header
      initial={azHareket ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-kart border border-cizgi bg-yuzey p-6 sm:p-8"
    >
      <p className="rakam mb-6 text-sm text-sonuk">
        {sonuc.no ? `No. ${sonuc.no}` : sonuc.baslik} · {tarihiYaz(sonuc.tarih)}
      </p>
      <p className="rakam text-6xl leading-none tracking-tight sm:text-7xl">
        {sonuc.toplam}
        <span className="text-3xl text-sonuk sm:text-4xl">/{sonuc.maksimum}</span>
      </p>
    </motion.header>
  )
}

function SonucSatiri({ sonuc, sira }: { sonuc: SoruSonucu; sira: number }) {
  const { soru, puan } = sonuc
  const dogru = soru.mode === 'mcq' && puan === 100

  return (
    <li className="rounded-kontrol bg-yuzey p-4">
      <div className="flex items-start gap-3">
        <span className="rakam pt-0.5 text-xs text-sonuk">
          {String(sira + 1).padStart(2, '0')}
        </span>
        <div className="min-w-0 flex-1">
          <p className="leading-snug">{soru.prompt}</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
            {soru.mode === 'fermi' ? (
              <>
                <span className="text-solgun">
                  Cevap{' '}
                  <span className="rakam text-metin">{sayiYaz(soru.answer)}</span>{' '}
                  {soru.unit}
                </span>
                <span className="text-solgun">
                  Sapma{' '}
                  <span className="rakam text-metin">
                    {oraniBicimle(sonuc.oran)}
                  </span>
                </span>
              </>
            ) : (
              <span className={dogru ? 'text-[#7FE3A3]' : 'text-[#FF8A73]'}>
                {dogru ? 'Doğru' : `Doğrusu: ${soru.choices[soru.correct_index]}`}
              </span>
            )}
          </p>
        </div>
        <span className="rakam shrink-0 text-lg">{puan}</span>
      </div>
    </li>
  )
}

function KopyalaDugmesi({ metin }: { metin: string }) {
  const [kopyalandi, setKopyalandi] = useState(false)
  const [hata, setHata] = useState(false)

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(metin)
      setKopyalandi(true)
      setHata(false)
      setTimeout(() => setKopyalandi(false), 2000)
    } catch {
      // Pano izni yoksa metni göster, oyuncu elle seçsin.
      setHata(true)
    }
  }

  return (
    <div className="flex-1">
      <button
        type="button"
        onClick={kopyala}
        className="flex w-full items-center justify-center gap-2 rounded-kontrol bg-metin px-6 py-3.5 font-medium text-zemin transition-transform active:scale-[0.99]"
      >
        {kopyalandi ? <CheckIcon size={18} weight="bold" /> : <CopyIcon size={18} />}
        {kopyalandi ? 'Kopyalandı' : 'Sonucu kopyala'}
      </button>
      {hata && (
        <pre className="rakam mt-3 overflow-x-auto rounded-kontrol border border-cizgi bg-yuzey p-4 text-xs text-solgun">
          {metin}
        </pre>
      )}
    </div>
  )
}

function SonucYok() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col justify-center px-4 text-center">
      <h1 className="mb-3 text-2xl tracking-tight">Gösterilecek sonuç yok</h1>
      <p className="mb-8 text-solgun">
        Sonuç ekranı son oynadığın oyunu gösterir. Sekmeyi kapattıysan yeniden
        oynaman gerekiyor.
      </p>
      <Link
        href="/"
        className="mx-auto rounded-kontrol bg-metin px-6 py-3 font-medium text-zemin"
      >
        Ana ekrana dön
      </Link>
    </main>
  )
}
