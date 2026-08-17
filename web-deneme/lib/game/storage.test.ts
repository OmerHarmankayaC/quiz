import { beforeEach, describe, expect, it } from 'vitest'
import {
  BOS_DURUM,
  durumuOku,
  durumuYaz,
  gunlukSonucuKaydet,
  paketSonucuKaydet,
  seriyiGuncelle,
  sonSonucuOku,
  sonSonucuYaz,
} from './storage'
import type { OyunSonucu } from './types'

/** Testler gerçek tarayıcı deposu olmadan koşsun diye asgari Storage taklidi. */
class SahteDepo implements Storage {
  private kutu = new Map<string, string>()
  get length() {
    return this.kutu.size
  }
  clear() {
    this.kutu.clear()
  }
  getItem(k: string) {
    return this.kutu.get(k) ?? null
  }
  key(i: number) {
    return [...this.kutu.keys()][i] ?? null
  }
  removeItem(k: string) {
    this.kutu.delete(k)
  }
  setItem(k: string, v: string) {
    this.kutu.set(k, v)
  }
}

let depo: SahteDepo

beforeEach(() => {
  depo = new SahteDepo()
})

describe('seriyiGuncelle', () => {
  it('ilk oyunda seri 1', () => {
    expect(seriyiGuncelle(null, '2026-08-17')).toEqual({
      sonTarih: '2026-08-17',
      sayi: 1,
    })
  })

  it('ardışık gün seriyi artırır', () => {
    const s = seriyiGuncelle({ sonTarih: '2026-08-17', sayi: 3 }, '2026-08-18')
    expect(s).toEqual({ sonTarih: '2026-08-18', sayi: 4 })
  })

  it('ay sınırını doğru geçer', () => {
    const s = seriyiGuncelle({ sonTarih: '2026-08-31', sayi: 5 }, '2026-09-01')
    expect(s.sayi).toBe(6)
  })

  it('atlanan gün seriyi 1e döndürür', () => {
    const s = seriyiGuncelle({ sonTarih: '2026-08-17', sayi: 9 }, '2026-08-19')
    expect(s).toEqual({ sonTarih: '2026-08-19', sayi: 1 })
  })

  it('aynı günü ikinci kez oynamak seriyi artırmaz', () => {
    const mevcut = { sonTarih: '2026-08-17', sayi: 4 }
    expect(seriyiGuncelle(mevcut, '2026-08-17')).toEqual(mevcut)
  })
})

describe('durumuOku', () => {
  it('boş depoda varsayılanı verir', () => {
    expect(durumuOku(depo)).toEqual(BOS_DURUM)
  })

  it('bozuk JSONdan kurtulur', () => {
    depo.setItem('kac.durum.v1', '{bu json degil')
    expect(durumuOku(depo)).toEqual(BOS_DURUM)
  })

  it('eksik alanları atar, kalanı korur', () => {
    depo.setItem(
      'kac.durum.v1',
      JSON.stringify({ seri: { sonTarih: 5 }, gunluk: { '2026-08-17': 240 } }),
    )
    const d = durumuOku(depo)
    expect(d.seri).toBeNull()
    expect(d.gunluk['2026-08-17']).toBe(240)
    expect(d.paketler).toEqual({})
  })

  it('sayı olmayan puanı yok sayar', () => {
    depo.setItem(
      'kac.durum.v1',
      JSON.stringify({ gunluk: { a: 'yüz', b: 120, c: null } }),
    )
    expect(durumuOku(depo).gunluk).toEqual({ b: 120 })
  })

  it('yazılanı geri okur', () => {
    durumuYaz({ ...BOS_DURUM, seri: { sonTarih: '2026-08-17', sayi: 2 } }, depo)
    expect(durumuOku(depo).seri?.sayi).toBe(2)
  })
})

describe('gunlukSonucuKaydet', () => {
  it('puanı ve seriyi birlikte yazar', () => {
    const d = gunlukSonucuKaydet('2026-08-17', 240, depo)
    expect(d.gunluk['2026-08-17']).toBe(240)
    expect(d.seri?.sayi).toBe(1)
  })

  it('ardışık günlerde seri büyür', () => {
    gunlukSonucuKaydet('2026-08-17', 240, depo)
    const d = gunlukSonucuKaydet('2026-08-18', 180, depo)
    expect(d.seri?.sayi).toBe(2)
  })

  it('aynı günün düşük skoru yüksek skoru ezmez', () => {
    gunlukSonucuKaydet('2026-08-17', 280, depo)
    const d = gunlukSonucuKaydet('2026-08-17', 100, depo)
    expect(d.gunluk['2026-08-17']).toBe(280)
    expect(d.seri?.sayi).toBe(1)
  })
})

describe('paketSonucuKaydet', () => {
  it('ilk oynayışta kaydeder', () => {
    const d = paketSonucuKaydet('dunyayi-olcmek', 720, '2026-08-17T10:00:00Z', depo)
    expect(d.paketler['dunyayi-olcmek'].enIyi).toBe(720)
  })

  it('daha iyi skor eskisini ezer', () => {
    paketSonucuKaydet('dunyayi-olcmek', 720, '2026-08-17T10:00:00Z', depo)
    const d = paketSonucuKaydet('dunyayi-olcmek', 810, '2026-08-18T10:00:00Z', depo)
    expect(d.paketler['dunyayi-olcmek'].enIyi).toBe(810)
    expect(d.paketler['dunyayi-olcmek'].tamamlandi).toBe('2026-08-18T10:00:00Z')
  })

  it('düşük skor en iyiyi ezmez', () => {
    paketSonucuKaydet('dunyayi-olcmek', 810, '2026-08-17T10:00:00Z', depo)
    paketSonucuKaydet('dunyayi-olcmek', 400, '2026-08-18T10:00:00Z', depo)
    expect(durumuOku(depo).paketler['dunyayi-olcmek'].enIyi).toBe(810)
  })

  it('paketler birbirini ezmez', () => {
    paketSonucuKaydet('a', 500, 'z', depo)
    paketSonucuKaydet('b', 600, 'z', depo)
    const d = durumuOku(depo)
    expect(d.paketler.a.enIyi).toBe(500)
    expect(d.paketler.b.enIyi).toBe(600)
  })
})

describe('son sonuç taşıma', () => {
  const sonuc: OyunSonucu = {
    kaynak: 'gunluk',
    baslik: 'Bugünün bulmacası',
    no: 1,
    tarih: '2026-08-17',
    sonuclar: [],
    toplam: 0,
    maksimum: 300,
  }

  it('yazıp okur', () => {
    sonSonucuYaz(sonuc, depo)
    expect(sonSonucuOku(depo)?.no).toBe(1)
  })

  it('boş oturumda null', () => {
    expect(sonSonucuOku(depo)).toBeNull()
  })

  it('bozuk kayıtta null', () => {
    depo.setItem('kac.sonSonuc.v1', '{"sonuclar": "dizi degil"}')
    expect(sonSonucuOku(depo)).toBeNull()
  })
})
