import { describe, expect, it } from 'vitest'
import { paylasimMetni } from './share'
import { soruyuPuanla } from './scoring'
import type { FermiSoru, McqSoru, OyunSonucu } from './types'

const fermi: FermiSoru = {
  id: 'f1',
  mode: 'fermi',
  prompt: 'Kaç?',
  topics: [],
  difficulty: 2,
  source: 's',
  origin: 'original',
  answer: 1000,
  unit: 'adet',
}

const mcq: McqSoru = {
  id: 'm1',
  mode: 'mcq',
  prompt: 'Hangisi?',
  topics: [],
  difficulty: 2,
  source: 's',
  origin: 'wiki',
  choices: ['a', 'b', 'c', 'd'],
  correct_index: 1,
  explanation: '',
}

const sonuclar = [
  soruyuPuanla(fermi, { mode: 'fermi', tahmin: 1340 }),
  soruyuPuanla(mcq, { mode: 'mcq', secim: 1 }),
  soruyuPuanla(mcq, { mode: 'mcq', secim: 3 }),
]

const gunluk: OyunSonucu = {
  kaynak: 'gunluk',
  baslik: 'Kaç? No. 68',
  no: 68,
  tarih: '2026-08-17',
  sonuclar,
  toplam: 191,
  maksimum: 300,
}

describe('paylasimMetni', () => {
  it('günlük bulmacada numara ile başlar', () => {
    expect(paylasimMetni(gunluk).split('\n')[0]).toBe('Kaç? · No. 68')
  })

  it('pakette paket adıyla başlar', () => {
    const paket: OyunSonucu = {
      ...gunluk,
      no: undefined,
      kaynak: 'dunyayi-olcmek',
      baslik: 'Dünyayı Ölçmek',
    }
    expect(paylasimMetni(paket).split('\n')[0]).toBe('Kaç? · Dünyayı Ölçmek')
  })

  it('fermi satırı sapmayı, mcq satırı sonucu yazar', () => {
    const satirlar = paylasimMetni(gunluk).split('\n')
    expect(satirlar[1]).toBe('191/300')
    expect(satirlar[3]).toBe('01 1.34x')
    expect(satirlar[4]).toBe('02 doğru')
    expect(satirlar[5]).toBe('03 yanlış')
  })

  it('doğru cevabı metne sızdırmaz', () => {
    expect(paylasimMetni(gunluk)).not.toContain('1000')
  })

  it('boş sonuçta çökmez', () => {
    const bos: OyunSonucu = { ...gunluk, sonuclar: [], toplam: 0 }
    expect(paylasimMetni(bos).split('\n')).toHaveLength(3)
  })
})
