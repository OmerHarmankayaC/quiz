/**
 * Panoya kopyalanan paylaşım metni. Saf.
 *
 * fermi.gg satır satır `01 1.34x` yazar; bizde iki soru tipi olduğu için
 * fermi satırı sapmayı, MCQ satırı doğru/yanlışı taşır. Doğru cevap metne
 * girmez: paylaşım bulmacayı bozmamalı.
 */

import { oraniBicimle } from './scoring'
import type { OyunSonucu, SoruSonucu } from './types'

function satir(sonuc: SoruSonucu, sira: number): string {
  const no = String(sira + 1).padStart(2, '0')
  if (sonuc.soru.mode === 'fermi') return `${no} ${oraniBicimle(sonuc.oran)}`
  return `${no} ${sonuc.puan === 100 ? 'doğru' : 'yanlış'}`
}

export function paylasimMetni(sonuc: OyunSonucu): string {
  const baslik = sonuc.no ? `Kaç? · No. ${sonuc.no}` : `Kaç? · ${sonuc.baslik}`
  return [
    baslik,
    `${sonuc.toplam}/${sonuc.maksimum}`,
    '',
    ...sonuc.sonuclar.map(satir),
  ].join('\n')
}
