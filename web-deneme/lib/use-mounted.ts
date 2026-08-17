'use client'

import { useEffect, useState } from 'react'

/**
 * Statik çıktıda HTML derleme anında üretilir; bugünün tarihi ise ancak
 * tarayıcıda bilinir. Tarihe bağlı ekranlar bağlanana kadar bekler, yoksa
 * derleme günü ile ziyaret günü ayrıştığında hidrasyon patlar.
 */
export function useMounted(): boolean {
  const [bagli, setBagli] = useState(false)
  useEffect(() => setBagli(true), [])
  return bagli
}
