'use client'

import { useEffect, useState } from 'react'
import { durumuOku, type Durum } from './game/storage'

/**
 * Kayıtlı durumu okur. İlk render'da `null` döner: sunucuda localStorage yok,
 * statik HTML ile ilk istemci render'ı ayrışırsa hidrasyon patlar. Bileşenler
 * `null` hâlini "henüz bilinmiyor" diye ele alır.
 */
export function useDurum(): Durum | null {
  const [durum, setDurum] = useState<Durum | null>(null)
  useEffect(() => setDurum(durumuOku()), [])
  return durum
}
