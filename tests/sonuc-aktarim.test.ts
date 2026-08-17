import { describe, it, expect, beforeEach } from 'vitest';
import { sonucuSakla, sonucuAl, type SaklananSonuc } from '@/lib/game/sonuc-aktarim';

const ANAHTAR = 'kac:son-sonuc';

const ornek: SaklananSonuc = {
	baslik: 'Kaç? · No. 23',
	soruIdler: ['f0001', 'm0002'],
	cevaplar: [1200, 2],
	puanlar: [78, 100]
};

beforeEach(() => sessionStorage.clear());

describe('sonucuSakla ve sonucuAl', () => {
	it('yazilani geri okur', () => {
		sonucuSakla(ornek);
		expect(sonucuAl()).toEqual(ornek);
	});

	it('bos sessionStorage null verir', () => {
		expect(sonucuAl()).toBe(null);
	});

	it('bozuk JSON null verir', () => {
		sessionStorage.setItem(ANAHTAR, '{bozuk');
		expect(sonucuAl()).toBe(null);
	});

	it('bos nesne null verir', () => {
		sessionStorage.setItem(ANAHTAR, JSON.stringify({}));
		expect(sonucuAl()).toBe(null);
	});

	it('dizi null verir', () => {
		sessionStorage.setItem(ANAHTAR, JSON.stringify([1, 2, 3]));
		expect(sonucuAl()).toBe(null);
	});

	it('baslik metin degilse null verir', () => {
		sessionStorage.setItem(
			ANAHTAR,
			JSON.stringify({ ...ornek, baslik: 5 })
		);
		expect(sonucuAl()).toBe(null);
	});

	it('soruIdler dizi degilse null verir', () => {
		sessionStorage.setItem(ANAHTAR, JSON.stringify({ ...ornek, soruIdler: 'f0001' }));
		expect(sonucuAl()).toBe(null);
	});

	it('soruIdler icinde sayi varsa null verir', () => {
		sessionStorage.setItem(ANAHTAR, JSON.stringify({ ...ornek, soruIdler: ['f0001', 3] }));
		expect(sonucuAl()).toBe(null);
	});

	it('cevaplar icinde metin varsa null verir', () => {
		sessionStorage.setItem(ANAHTAR, JSON.stringify({ ...ornek, cevaplar: [1200, 'iki'] }));
		expect(sonucuAl()).toBe(null);
	});

	it('puanlar sonlu olmayan sayi icerirse null verir', () => {
		// JSON Infinity'yi null'a cevirir - sonuc yine reddedilmeli.
		sessionStorage.setItem(ANAHTAR, JSON.stringify({ ...ornek, puanlar: [78, Infinity] }));
		expect(sonucuAl()).toBe(null);
	});

	it('puanlar eksikse null verir', () => {
		const { puanlar: _puanlar, ...eksik } = ornek;
		sessionStorage.setItem(ANAHTAR, JSON.stringify(eksik));
		expect(sonucuAl()).toBe(null);
	});

	it('bos dizili sonuc gecerlidir', () => {
		const bos: SaklananSonuc = { baslik: 'Kaç?', soruIdler: [], cevaplar: [], puanlar: [] };
		sonucuSakla(bos);
		expect(sonucuAl()).toEqual(bos);
	});
});
