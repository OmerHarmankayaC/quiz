import { describe, expect, it } from 'vitest'
import {
  fermiPuani,
  maksimumPuan,
  mcqPuani,
  oraniBicimle,
  oranHesapla,
  orandanPuan,
  soruyuPuanla,
  toplamPuan,
} from './scoring'
import type { FermiSoru, McqSoru, SoruSonucu } from './types'

const fermi: FermiSoru = {
  id: 'f0001',
  mode: 'fermi',
  prompt: 'Kaç?',
  topics: ['test'],
  difficulty: 2,
  source: 'test',
  origin: 'original',
  answer: 1000,
  unit: 'adet',
}

const mcq: McqSoru = {
  id: 'm0001',
  mode: 'mcq',
  prompt: 'Hangisi?',
  topics: ['test'],
  difficulty: 2,
  source: 'test',
  origin: 'wiki',
  choices: ['a', 'b', 'c', 'd'],
  correct_index: 2,
  explanation: 'çünkü',
}

describe('oranHesapla', () => {
  it('tam isabette 1 döner', () => {
    expect(oranHesapla(1000, 1000)).toBe(1)
  })

  it('yön fark etmez, hep >= 1', () => {
    expect(oranHesapla(2000, 1000)).toBe(2)
    expect(oranHesapla(500, 1000)).toBe(2)
  })

  it('sıfır ve negatif tahmin sonsuz verir', () => {
    expect(oranHesapla(0, 1000)).toBe(Infinity)
    expect(oranHesapla(-5, 1000)).toBe(Infinity)
  })

  it('sonlu olmayan girdi sonsuz verir', () => {
    expect(oranHesapla(NaN, 1000)).toBe(Infinity)
    expect(oranHesapla(Infinity, 1000)).toBe(Infinity)
  })
})

describe('orandanPuan', () => {
  const beklenen: [number, number][] = [
    [1.0, 100],
    [1.2, 96],
    [1.5, 91],
    [2, 85],
    [5, 65],
    [10, 50],
    [100, 0],
    [1000, 0],
  ]

  it.each(beklenen)('%sx oranı %s puan verir', (oran, puan) => {
    expect(orandanPuan(oran)).toBe(puan)
  })

  it('sonsuz oran 0 puan', () => {
    expect(orandanPuan(Infinity)).toBe(0)
  })

  it('1 altındaki oran geçersiz kabul edilir', () => {
    expect(orandanPuan(0.5)).toBe(0)
  })

  it('puan hiçbir zaman 0-100 dışına çıkmaz', () => {
    for (const oran of [1, 1.001, 3, 7, 99, 101, 1e9]) {
      const p = orandanPuan(oran)
      expect(p).toBeGreaterThanOrEqual(0)
      expect(p).toBeLessThanOrEqual(100)
    }
  })
})

describe('fermiPuani', () => {
  it('sıfır tahmin çökmez, 0 puan verir', () => {
    expect(fermiPuani(0, 1000)).toBe(0)
  })

  it('iki kat sapma 85 puan', () => {
    expect(fermiPuani(2000, 1000)).toBe(85)
  })

  it('ondalıklı cevapla da çalışır', () => {
    expect(fermiPuani(0.2, 0.1)).toBe(85)
  })
})

describe('mcqPuani', () => {
  it('doğru şık 100', () => {
    expect(mcqPuani(2, 2)).toBe(100)
  })

  it('yanlış şık 0', () => {
    expect(mcqPuani(0, 2)).toBe(0)
  })
})

describe('soruyuPuanla', () => {
  it('fermi sorusunda oranı da döndürür', () => {
    const s = soruyuPuanla(fermi, { mode: 'fermi', tahmin: 2000 })
    expect(s.puan).toBe(85)
    expect(s.oran).toBe(2)
  })

  it('mcq sorusunda oran taşımaz', () => {
    const s = soruyuPuanla(mcq, { mode: 'mcq', secim: 2 })
    expect(s.puan).toBe(100)
    expect(s.oran).toBeUndefined()
  })

  it('yanıt tipi soru tipiyle uyuşmazsa 0 puan', () => {
    const s = soruyuPuanla(fermi, { mode: 'mcq', secim: 2 })
    expect(s.puan).toBe(0)
  })
})

describe('paket toplamı', () => {
  it('puanları toplar', () => {
    const sonuclar: SoruSonucu[] = [
      soruyuPuanla(fermi, { mode: 'fermi', tahmin: 1000 }),
      soruyuPuanla(mcq, { mode: 'mcq', secim: 2 }),
      soruyuPuanla(mcq, { mode: 'mcq', secim: 0 }),
    ]
    expect(toplamPuan(sonuclar)).toBe(200)
  })

  it('boş liste 0 verir', () => {
    expect(toplamPuan([])).toBe(0)
  })

  it('10 soruluk paket 1000 üzerinden', () => {
    expect(maksimumPuan(10)).toBe(1000)
  })
})

describe('oraniBicimle', () => {
  it('iki basamak ve x eki', () => {
    expect(oraniBicimle(1.337)).toBe('1.34x')
  })

  it('tanımsız ve sonsuz oran tire', () => {
    expect(oraniBicimle(undefined)).toBe('-')
    expect(oraniBicimle(Infinity)).toBe('-')
  })
})
