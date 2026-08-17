'use client'

import { OyunEkrani } from '@/components/oyun-ekrani'
import { Yukleniyor } from '@/components/yukleniyor'
import { TAKVIM, sorulariTopla } from '@/lib/bank'
import { bugununBulmacasi } from '@/lib/game/daily'
import { useMounted } from '@/lib/use-mounted'

/**
 * Bugünün bulmacası. Hangi günde olduğumuz ancak tarayıcıda bilinebildiği
 * için ekran istemcide çözülür; statik HTML iskelet olarak çıkar.
 */
export default function GunlukEkrani() {
  const bagli = useMounted()
  if (!bagli) return <Yukleniyor />

  const bugun = bugununBulmacasi(TAKVIM)
  if (!bugun) return <Yukleniyor />

  return (
    <OyunEkrani
      kaynak="gunluk"
      baslik={`Kaç? No. ${bugun.no}`}
      ustBaslik="Bugün"
      no={bugun.no}
      tarih={bugun.tarih}
      sorular={sorulariTopla(bugun.soru_ids)}
    />
  )
}
