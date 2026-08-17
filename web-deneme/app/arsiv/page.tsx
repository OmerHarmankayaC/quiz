'use client'

import Link from 'next/link'
import { ArrowLeftIcon } from '@phosphor-icons/react/dist/ssr'
import { Yukleniyor } from '@/components/yukleniyor'
import { TAKVIM } from '@/lib/bank'
import { gecmisGunler } from '@/lib/game/daily'
import { durumuOku } from '@/lib/game/storage'
import { useMounted } from '@/lib/use-mounted'
import type { TakvimGunu } from '@/lib/game/types'

const AY_ADLARI = [
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

const GUNLUK_TAVAN = 300

/**
 * Geçmiş günler. Uzun bir liste yerine aya bölünmüş kareler: 68 satırlık
 * bir döküm okunmuyor, aynı veri ızgarada tek bakışta görülüyor.
 */
export default function ArsivEkrani() {
  const bagli = useMounted()
  if (!bagli) return <Yukleniyor />

  const gunler = gecmisGunler(TAKVIM)
  const gunluk = durumuOku().gunluk
  const oynanan = gunler.filter((g) => gunluk[g.tarih] !== undefined)
  const puanlar = oynanan.map((g) => gunluk[g.tarih])

  const aylar = new Map<string, TakvimGunu[]>()
  for (const gun of gunler) {
    const anahtar = gun.tarih.slice(0, 7)
    aylar.set(anahtar, [...(aylar.get(anahtar) ?? []), gun])
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-20 pt-5 sm:px-6">
      <Link
        href="/"
        className="flex h-8 items-center gap-2 text-sm text-solgun transition-colors hover:text-metin"
      >
        <ArrowLeftIcon size={16} weight="bold" />
        Ana ekran
      </Link>

      <h1 className="mb-8 mt-6 text-3xl tracking-tight">Arşiv</h1>

      {gunler.length === 0 ? (
        <BosArsiv />
      ) : (
        <>
          <div className="mb-12 grid grid-cols-3 gap-3">
            <Ozet
              etiket="Oynanan gün"
              deger={`${oynanan.length}/${gunler.length}`}
            />
            <Ozet
              etiket="Ortalama"
              deger={
                puanlar.length
                  ? String(
                      Math.round(puanlar.reduce((a, b) => a + b, 0) / puanlar.length),
                    )
                  : '-'
              }
            />
            <Ozet
              etiket="En iyi"
              deger={puanlar.length ? String(Math.max(...puanlar)) : '-'}
            />
          </div>

          <div className="space-y-10">
            {[...aylar].map(([anahtar, ayGunleri]) => (
              <section key={anahtar}>
                <h2 className="mb-3 text-sm text-solgun">
                  {AY_ADLARI[Number(anahtar.slice(5)) - 1]} {anahtar.slice(0, 4)}
                </h2>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-2">
                  {[...ayGunleri].reverse().map((gun) => (
                    <GunKaresi
                      key={gun.tarih}
                      gun={gun}
                      puan={gunluk[gun.tarih]}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Ozet({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <div className="rounded-kontrol bg-yuzey p-4">
      <p className="mb-1 text-xs text-solgun">{etiket}</p>
      <p className="rakam text-xl">{deger}</p>
    </div>
  )
}

function GunKaresi({ gun, puan }: { gun: TakvimGunu; puan?: number }) {
  const oynandi = puan !== undefined
  // Dolgu puanla artar: ızgara tek bakışta hangi günün iyi gittiğini söyler.
  const yogunluk = oynandi ? 0.08 + (puan / GUNLUK_TAVAN) * 0.5 : 0

  return (
    <div
      className={`flex aspect-square flex-col justify-between rounded-kontrol p-2.5 ${
        oynandi ? 'text-metin' : 'border border-cizgi text-sonuk'
      }`}
      style={
        oynandi ? { backgroundColor: `rgba(242, 240, 234, ${yogunluk})` } : undefined
      }
      title={`${gun.tarih}${oynandi ? `: ${puan}/${GUNLUK_TAVAN}` : ': oynanmadı'}`}
    >
      <span className="rakam text-xs opacity-70">{gun.no}</span>
      <span className="rakam text-sm">{oynandi ? puan : ''}</span>
    </div>
  )
}

function BosArsiv() {
  return (
    <div className="rounded-kart border border-cizgi bg-yuzey p-8 text-center">
      <p className="mb-6 text-solgun">
        Takvim henüz başlamadı. İlk bulmaca açıldığında burada görünecek.
      </p>
      <Link
        href="/"
        className="inline-block rounded-kontrol bg-metin px-6 py-3 font-medium text-zemin"
      >
        Ana ekrana dön
      </Link>
    </div>
  )
}
