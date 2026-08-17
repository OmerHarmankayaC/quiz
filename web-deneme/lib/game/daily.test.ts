import { describe, expect, it } from 'vitest'
import {
  bugununBulmacasi,
  bugununTarihi,
  gecmisGunler,
  gunuBul,
  tarihiYaz,
} from './daily'
import type { TakvimGunu } from './types'

const takvim: TakvimGunu[] = [
  { tarih: '2026-08-17', no: 1, soru_ids: ['f0001', 'm0001', 'm0002'] },
  { tarih: '2026-08-18', no: 2, soru_ids: ['f0002', 'm0003', 'm0004'] },
  { tarih: '2026-08-19', no: 3, soru_ids: ['f0003', 'm0005', 'm0006'] },
]

describe('bugununTarihi', () => {
  it('aynı an hep aynı tarihi verir', () => {
    const an = new Date('2026-08-17T09:00:00Z')
    expect(bugununTarihi(an)).toBe(bugununTarihi(an))
  })

  it('İstanbul saatiyle 23:59 hâlâ o gündür', () => {
    // UTC+3: 20:59Z = 23:59 İstanbul
    expect(bugununTarihi(new Date('2026-08-17T20:59:00Z'))).toBe('2026-08-17')
  })

  it('İstanbul saatiyle 00:01 ertesi gündür', () => {
    // UTC+3: 21:01Z = 00:01 İstanbul, ertesi gün
    expect(bugununTarihi(new Date('2026-08-17T21:01:00Z'))).toBe('2026-08-18')
  })

  it('UTC gününden ileride olduğu anları doğru taşır', () => {
    // 22:30Z hâlâ 17'si UTC'de ama İstanbul'da 18'i olmuştur
    expect(bugununTarihi(new Date('2026-08-17T22:30:00Z'))).toBe('2026-08-18')
  })
})

describe('gunuBul', () => {
  it('takvimdeki tarihi bulur', () => {
    expect(gunuBul(takvim, '2026-08-18')?.no).toBe(2)
  })

  it('takvim dışı tarih için null', () => {
    expect(gunuBul(takvim, '2027-01-01')).toBeNull()
  })
})

describe('bugununBulmacasi', () => {
  it('aynı tarih hep aynı bulmacayı verir', () => {
    const a = bugununBulmacasi(takvim, new Date('2026-08-18T06:00:00Z'))
    const b = bugununBulmacasi(takvim, new Date('2026-08-18T15:00:00Z'))
    expect(a).toEqual(b)
    expect(a?.no).toBe(2)
  })

  it('takvim bittiğinde null döner, çökmez', () => {
    expect(bugununBulmacasi(takvim, new Date('2030-01-01T12:00:00Z'))).toBeNull()
  })
})

describe('takvim bütünlüğü', () => {
  it('aynı soru iki farklı günde çıkmaz', () => {
    const hepsi = takvim.flatMap((g) => g.soru_ids)
    expect(new Set(hepsi).size).toBe(hepsi.length)
  })

  it('her gün üç soru taşır', () => {
    for (const gun of takvim) expect(gun.soru_ids).toHaveLength(3)
  })
})

describe('gecmisGunler', () => {
  it('gelecekteki günleri gizler', () => {
    const gunler = gecmisGunler(takvim, new Date('2026-08-18T12:00:00Z'))
    expect(gunler.map((g) => g.tarih)).toEqual(['2026-08-18', '2026-08-17'])
  })

  it('en yeni gün başta', () => {
    const gunler = gecmisGunler(takvim, new Date('2026-08-20T12:00:00Z'))
    expect(gunler[0].tarih).toBe('2026-08-19')
  })
})

describe('tarihiYaz', () => {
  it('Türkçe ay adıyla yazar', () => {
    expect(tarihiYaz('2026-08-17')).toBe('17 Ağustos 2026')
  })

  it('başındaki sıfırı atar', () => {
    expect(tarihiYaz('2026-01-05')).toBe('5 Ocak 2026')
  })

  it('tanımadığı biçimi olduğu gibi bırakır', () => {
    expect(tarihiYaz('bozuk')).toBe('bozuk')
  })
})
