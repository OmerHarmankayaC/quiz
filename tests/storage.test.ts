import { describe, it, expect, beforeEach } from 'vitest';
import {
	BOS_KAYIT,
	kaydiOku,
	kaydiYaz,
	gunuKaydet,
	paketiKaydet,
	type OyunKaydi
} from '@/lib/game/storage';

beforeEach(() => localStorage.clear());

describe('gunuKaydet', () => {
	it('ilk oyunda streak 1 olur', () => {
		const k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		expect(k.streak).toBe(1);
		expect(k.sonOynananGun).toBe('2026-08-17');
		expect(k.gunluk['2026-08-17']).toBe(250);
	});

	it('ardisik gunde streak artar', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-18', 260);
		expect(k.streak).toBe(2);
	});

	it('atlanan gunde streak 1e doner', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-18', 260);
		k = gunuKaydet(k, '2026-08-20', 270);
		expect(k.streak).toBe(1);
	});

	it('ayni gunu ikinci kez oynamak streaki sismez', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-17', 100);
		expect(k.streak).toBe(1);
	});

	it('ayni gunde dusuk puan yuksegi ezmez', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-17', 100);
		expect(k.gunluk['2026-08-17']).toBe(250);
	});

	it('girdi kaydini degistirmez', () => {
		const once = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		gunuKaydet(once, '2026-08-18', 300);
		expect(once.streak).toBe(1);
		expect(once.sonOynananGun).toBe('2026-08-17');
	});
});

describe('paketiKaydet', () => {
	it('yeni paketi kaydeder', () => {
		const k = paketiKaydet(BOS_KAYIT, 'sayilarla-istanbul', 874, '2026-08-17T10:00:00Z');
		expect(k.paketler['sayilarla-istanbul'].enIyi).toBe(874);
	});

	it('dusuk skor en iyiyi ezmez', () => {
		let k = paketiKaydet(BOS_KAYIT, 'sayilarla-istanbul', 874, '2026-08-17T10:00:00Z');
		k = paketiKaydet(k, 'sayilarla-istanbul', 500, '2026-08-18T10:00:00Z');
		expect(k.paketler['sayilarla-istanbul'].enIyi).toBe(874);
	});

	it('yuksek skor en iyiyi gunceller', () => {
		let k = paketiKaydet(BOS_KAYIT, 'sayilarla-istanbul', 500, '2026-08-17T10:00:00Z');
		k = paketiKaydet(k, 'sayilarla-istanbul', 900, '2026-08-18T10:00:00Z');
		expect(k.paketler['sayilarla-istanbul'].enIyi).toBe(900);
		expect(k.paketler['sayilarla-istanbul'].tamamlandi).toBe('2026-08-18T10:00:00Z');
	});
});

describe('kaydiOku ve kaydiYaz', () => {
	it('yazilani geri okur', () => {
		const k: OyunKaydi = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		kaydiYaz(k);
		expect(kaydiOku()).toEqual(k);
	});

	it('bos localStorage bos kayit verir', () => {
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('bozuk JSON bos kayit verir', () => {
		localStorage.setItem('kac:v1', '{bozuk');
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('eksik alanli kayit bos kayit verir', () => {
		localStorage.setItem('kac:v1', JSON.stringify({ streak: 3 }));
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('yanlis tipli streak bos kayit verir', () => {
		localStorage.setItem(
			'kac:v1',
			JSON.stringify({ streak: 'uc', sonOynananGun: null, gunluk: {}, paketler: {} })
		);
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('gunluk degeri sayi olmayan kayit bos kayit verir', () => {
		localStorage.setItem(
			'kac:v1',
			JSON.stringify({ streak: 1, sonOynananGun: null, gunluk: { '2026-08-17': 'x' }, paketler: {} })
		);
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('paketler girdisi eksik alanli kayit bos kayit verir', () => {
		localStorage.setItem(
			'kac:v1',
			JSON.stringify({
				streak: 1,
				sonOynananGun: null,
				gunluk: {},
				paketler: { 'sayilarla-istanbul': { enIyi: 500 } }
			})
		);
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});
});
