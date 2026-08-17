import { describe, it, expect } from 'vitest';
import { bugununTarihi, gunuBul, takvimHatalari, oncekiGun } from '@/lib/game/daily';
import type { TakvimGunu } from '@/lib/game/types';

const takvim: TakvimGunu[] = [
	{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'm1', 'm2'] },
	{ tarih: '2026-08-18', no: 2, soru_ids: ['f2', 'm3', 'm4'] }
];

describe('bugununTarihi', () => {
	it('istanbul saatine gore gun sinirini dogru ceker', () => {
		expect(bugununTarihi(new Date('2026-08-17T20:59:00Z'))).toBe('2026-08-17');
		expect(bugununTarihi(new Date('2026-08-17T21:01:00Z'))).toBe('2026-08-18');
	});

	it('YYYY-MM-DD bicimi verir', () => {
		expect(bugununTarihi(new Date('2026-01-05T12:00:00Z'))).toBe('2026-01-05');
	});
});

describe('gunuBul', () => {
	it('ayni tarih hep ayni bulmacayi verir', () => {
		expect(gunuBul(takvim, '2026-08-17')).toEqual(takvim[0]);
		expect(gunuBul(takvim, '2026-08-17')).toEqual(takvim[0]);
	});

	it('takvim disi tarih null verir', () => {
		expect(gunuBul(takvim, '2030-01-01')).toBeNull();
	});
});

describe('oncekiGun', () => {
	it('bir gun geri gider', () => {
		expect(oncekiGun('2026-08-18')).toBe('2026-08-17');
	});

	it('ay sinirini asar', () => {
		expect(oncekiGun('2026-09-01')).toBe('2026-08-31');
	});

	it('yil sinirini asar', () => {
		expect(oncekiGun('2027-01-01')).toBe('2026-12-31');
	});
});

describe('takvimHatalari', () => {
	it('gecerli takvimde bos dizi verir', () => {
		expect(takvimHatalari(takvim)).toEqual([]);
	});

	it('tekrar eden tarihi yakalar', () => {
		const bozuk: TakvimGunu[] = [...takvim, { tarih: '2026-08-17', no: 3, soru_ids: ['f3', 'm5', 'm6'] }];
		expect(takvimHatalari(bozuk)).toContain('tekrar eden tarih: 2026-08-17');
	});

	it('gun icinde tekrar eden soruyu yakalar', () => {
		const bozuk: TakvimGunu[] = [{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'f1', 'm2'] }];
		expect(takvimHatalari(bozuk)).toContain('2026-08-17 gununde ayni soru iki kez: f1');
	});

	it('gunler arasi tekrar eden soruyu yakalar', () => {
		const bozuk: TakvimGunu[] = [
			{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'm1', 'm2'] },
			{ tarih: '2026-08-18', no: 2, soru_ids: ['f1', 'm3', 'm4'] }
		];
		expect(takvimHatalari(bozuk)).toContain('soru birden fazla gunde: f1');
	});

	it('uc soru olmayan gunu yakalar', () => {
		const bozuk: TakvimGunu[] = [{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'm1'] }];
		expect(takvimHatalari(bozuk)).toContain('2026-08-17 gununde 3 yerine 2 soru var');
	});
});
