import { describe, expect, it } from 'vitest'
import { sayiKisa, sayiOku, sayiYaz } from './format'

describe('sayiYaz', () => {
  it('binlik ayracı nokta', () => {
    expect(sayiYaz(1084170)).toBe('1.084.170')
  })

  it('küçük ondalık virgüllü', () => {
    expect(sayiYaz(0.25)).toBe('0,25')
  })

  it('büyük sayıda ondalık göstermez', () => {
    expect(sayiYaz(1234.56)).toBe('1.235')
  })

  it('sonlu olmayan girdi tire', () => {
    expect(sayiYaz(Infinity)).toBe('-')
    expect(sayiYaz(NaN)).toBe('-')
  })
})

describe('sayiKisa', () => {
  it('milyon basamağını adıyla yazar', () => {
    expect(sayiKisa(1084170)).toBe('1,08 milyon')
  })

  it('katrilyona kadar çıkar', () => {
    expect(sayiKisa(2e16)).toBe('20,0 katrilyon')
  })

  it('bin altını olduğu gibi bırakır', () => {
    expect(sayiKisa(420)).toBe('420')
  })
})

describe('sayiOku', () => {
  it('düz sayıyı okur', () => {
    expect(sayiOku('1200')).toBe(1200)
  })

  it('TR binlik ayracını atar', () => {
    expect(sayiOku('1.084.170')).toBe(1084170)
  })

  it('TR ondalık virgülünü çevirir', () => {
    expect(sayiOku('12,5')).toBe(12.5)
  })

  it('boş ve bozuk girdide null', () => {
    expect(sayiOku('')).toBeNull()
    expect(sayiOku('abc')).toBeNull()
  })
})
