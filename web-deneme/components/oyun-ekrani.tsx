'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import type { BankaFermi } from '@/lib/bank'
import { bugununTarihi } from '@/lib/game/daily'
import { maksimumPuan, soruyuPuanla, toplamPuan } from '@/lib/game/scoring'
import {
  gunlukSonucuKaydet,
  paketSonucuKaydet,
  sonSonucuYaz,
} from '@/lib/game/storage'
import type { OyunSonucu, Soru, SoruSonucu, Yanit } from '@/lib/game/types'
import { Acilis } from './acilis'
import { FermiGirisi, baslangicDegeri } from './fermi-girisi'
import { Ilerleme } from './ilerleme'
import { McqGirisi } from './mcq-girisi'

/**
 * Tek oyun ekranı. Günlük bulmaca ile paket arasındaki tek fark hangi soru
 * dizisinin beslendiği; ilerleme, kilitleme ve açılış ortak.
 *
 * Kural mantığı burada değil: puanı `scoring`, kaydı `storage` yapar.
 */
export function OyunEkrani({
  kaynak,
  baslik,
  ustBaslik,
  no,
  tarih,
  sorular,
}: {
  /** 'gunluk' ya da paket slug'ı. Kaydın nereye yazılacağını belirler. */
  kaynak: string
  baslik: string
  ustBaslik: string
  no?: number
  /** Yalnızca günlük bulmacada verilir; pakette oynanan gün çalışma anında bulunur. */
  tarih?: string
  sorular: Soru[]
}) {
  const router = useRouter()
  const azHareket = useReducedMotion()

  const [i, setI] = useState(0)
  const [kilitli, setKilitli] = useState(false)
  const [sonuclar, setSonuclar] = useState<SoruSonucu[]>([])
  const [deger, setDeger] = useState(() =>
    sorular[0]?.mode === 'fermi' ? baslangicDegeri(sorular[0] as BankaFermi) : 1,
  )
  const [secim, setSecim] = useState<number | null>(null)

  const soru = sorular[i]
  if (!soru) return <BosEkran />

  const sonSoru = i === sorular.length - 1
  const hazir = soru.mode === 'fermi' ? deger > 0 : secim !== null
  const acilan = kilitli ? sonuclar[i] : null

  function kilitle() {
    if (!soru || kilitli || !hazir) return
    const yanit: Yanit =
      soru.mode === 'fermi'
        ? { mode: 'fermi', tahmin: deger }
        : { mode: 'mcq', secim: secim as number }
    setSonuclar((onceki) => [...onceki, soruyuPuanla(soru, yanit)])
    setKilitli(true)
  }

  function sonraki() {
    if (sonSoru) return bitir()
    const gelecek = sorular[i + 1]
    setI(i + 1)
    setKilitli(false)
    setSecim(null)
    setDeger(
      gelecek.mode === 'fermi' ? baslangicDegeri(gelecek as BankaFermi) : 1,
    )
  }

  function bitir() {
    const toplam = toplamPuan(sonuclar)
    const gun = tarih ?? bugununTarihi()
    const sonuc: OyunSonucu = {
      kaynak,
      baslik,
      no,
      tarih: gun,
      sonuclar,
      toplam,
      maksimum: maksimumPuan(sorular.length),
    }
    sonSonucuYaz(sonuc)
    if (kaynak === 'gunluk') {
      gunlukSonucuKaydet(gun, toplam)
    } else {
      paketSonucuKaydet(kaynak, toplam, new Date().toISOString())
    }
    router.push('/sonuc')
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col px-4 pt-5 sm:px-6">
      <header className="mb-8 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-solgun transition-colors hover:text-metin"
          >
            <ArrowLeftIcon size={16} weight="bold" />
            {ustBaslik}
          </Link>
          <span className="rakam text-sm text-sonuk">
            {i + 1}/{sorular.length}
          </span>
        </div>
        <Ilerleme
          toplam={sorular.length}
          bulunulan={i}
          bitenler={sonuclar.length}
        />
      </header>

      <div className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={soru.id}
            initial={azHareket ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={azHareket ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 space-y-8"
          >
            <h1 className="text-balance text-2xl leading-snug tracking-tight sm:text-3xl">
              {soru.prompt}
            </h1>

            {soru.mode === 'fermi' ? (
              <FermiGirisi
                soru={soru as BankaFermi}
                deger={deger}
                onDegisim={setDeger}
                kilitli={kilitli}
              />
            ) : (
              <McqGirisi
                soru={soru}
                secim={secim}
                onSecim={setSecim}
                kilitli={kilitli}
              />
            )}

            {acilan && <Acilis sonuc={acilan} />}
          </motion.div>
        </AnimatePresence>

        {/*
          Açılış paneli uzun olduğunda buton ekranın altına kaçıyordu.
          Yapışkan şerit hem kısa hem uzun içerikte butonu görünür tutuyor.
        */}
        <div className="sticky bottom-0 mt-10 flex items-center gap-3 bg-zemin pb-4 pt-4">
          {kilitli ? (
            <button
              type="button"
              onClick={sonraki}
              className="w-full rounded-kontrol bg-metin px-6 py-3.5 font-medium text-zemin transition-transform active:scale-[0.99]"
            >
              {sonSoru ? 'Sonucu gör' : 'Sonraki soru'}
            </button>
          ) : (
            <button
              type="button"
              onClick={kilitle}
              disabled={!hazir}
              className="w-full rounded-kontrol bg-metin px-6 py-3.5 font-medium text-zemin transition-transform active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-yuzey-2 disabled:text-sonuk disabled:active:scale-100"
            >
              {hazir ? 'Cevabı kilitle' : 'Bir şık seç'}
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

function BosEkran() {
  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-2xl flex-col justify-center px-4 text-center">
      <h1 className="mb-3 text-2xl tracking-tight">Burada soru yok</h1>
      <p className="mb-8 text-solgun">
        Bu bulmacanın soruları bankada bulunamadı.
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
