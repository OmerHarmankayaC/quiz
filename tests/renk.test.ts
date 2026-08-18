import { describe, it, expect } from 'vitest';
import { doygunluguDusur, karistir, kaplamaRengi, kontrastOrani, paketRenkleri } from '@/lib/game/renk';
import type { Paket } from '@/lib/game/types';

describe('doygunluguDusur', () => {
	it('k=0 rengi degistirmez', () => {
		expect(doygunluguDusur('#26215C', 0)).toBe('#26215c');
	});

	it('k=1 rengi tamamen griye cevirir', () => {
		const gri = doygunluguDusur('#26215C', 1);
		expect(gri.slice(1, 3)).toBe(gri.slice(3, 5));
		expect(gri.slice(3, 5)).toBe(gri.slice(5, 7));
	});

	it('bilinen paket renklerini beklenen mat karsiliklarina cevirir', () => {
		expect(doygunluguDusur('#3A1F1B', 0.3)).toBe('#34211e');
		expect(doygunluguDusur('#10322E', 0.3)).toBe('#172f2c');
		expect(doygunluguDusur('#2E2416', 0.3)).toBe('#2b241b');
		expect(doygunluguDusur('#331A2B', 0.3)).toBe('#2e1d29');
		expect(doygunluguDusur('#26215C', 0.3)).toBe('#27234d');
		expect(doygunluguDusur('#1B2A3A', 0.3)).toBe('#1f2934');
	});

	it('gri bir rengi degistirmez', () => {
		expect(doygunluguDusur('#808080', 0.5)).toBe('#808080');
	});
});

describe('karistir', () => {
	it('t=0 ilk rengi verir', () => {
		expect(karistir('#FFFFFF', '#000000', 0)).toBe('#ffffff');
	});

	it('t=1 ikinci rengi verir', () => {
		expect(karistir('#FFFFFF', '#000000', 1)).toBe('#000000');
	});

	it('t=0.5 ortayi verir', () => {
		expect(karistir('#FFFFFF', '#000000', 0.5)).toBe('#808080');
	});
});

describe('paketRenkleri', () => {
	const paket = (renk: string, metin: string): Paket => ({
		slug: 's',
		baslik: 'B',
		renk,
		metin_rengi: metin,
		soru_ids: []
	});

	it('bilinen paketler icin beklenen zemin ve metni verir', () => {
		expect(paketRenkleri(paket('#26215C', '#EEEDFE'))).toEqual({
			zemin: '#27234d',
			metin: '#b6b4cc',
			aciklama: '#9492ae'
		});
		expect(paketRenkleri(paket('#10322E', '#E3F5EE'))).toEqual({
			zemin: '#172f2c',
			metin: '#aabeb8',
			aciklama: '#879c97'
		});
		expect(paketRenkleri(paket('#1B2A3A', '#E4F0FA'))).toEqual({
			zemin: '#1f2934',
			metin: '#adb8c3',
			aciklama: '#8b96a1'
		});
	});

	it('altı gerçek paket için beklenen aciklama rengini verir', () => {
		expect(paketRenkleri(paket('#3A1F1B', '#FBEAE3')).aciklama).toBe('#a1908a');
		expect(paketRenkleri(paket('#2E2416', '#F7EEDC')).aciklama).toBe('#9b9385');
		expect(paketRenkleri(paket('#331A2B', '#FAE8F4')).aciklama).toBe('#9e8d99');
	});

	it('altı gerçek paketin aciklama rengi zeminle en az 4.5:1 kontrast verir', () => {
		const gercekPaketler: [string, string][] = [
			['#3A1F1B', '#FBEAE3'],
			['#10322E', '#E3F5EE'],
			['#2E2416', '#F7EEDC'],
			['#331A2B', '#FAE8F4'],
			['#26215C', '#EEEDFE'],
			['#1B2A3A', '#E4F0FA']
		];
		for (const [renk, metin] of gercekPaketler) {
			const { zemin, aciklama } = paketRenkleri(paket(renk, metin));
			expect(kontrastOrani(aciklama, zemin)).toBeGreaterThanOrEqual(4.5);
		}
	});
});

describe('kontrastOrani', () => {
	it('siyah-beyaz arasi 21:1 verir', () => {
		expect(kontrastOrani('#000000', '#ffffff')).toBeCloseTo(21, 1);
	});
});

describe('kontrast tabani', () => {
	const paket = (renk: string, metin: string): Paket => ({
		slug: 's',
		baslik: 'B',
		renk,
		metin_rengi: metin,
		soru_ids: []
	});

	it('orta tonlu bir zeminde metin en az 4.5:1 kontrast verir', () => {
		const { zemin, metin } = paketRenkleri(paket('#6E6A5F', '#EEEDFE'));
		expect(kontrastOrani(metin, zemin)).toBeGreaterThanOrEqual(4.5);
	});

	it('neredeyse beyaz bir zeminde metin en az 4.5:1 kontrast verir', () => {
		const { zemin, metin } = paketRenkleri(paket('#F2E9D8', '#EEEDFE'));
		expect(kontrastOrani(metin, zemin)).toBeGreaterThanOrEqual(4.5);
	});

	it('orta tonlu bir zeminde aciklama en az 4.5:1 kontrast verir', () => {
		const { zemin, aciklama } = paketRenkleri(paket('#6E6A5F', '#EEEDFE'));
		expect(kontrastOrani(aciklama, zemin)).toBeGreaterThanOrEqual(4.5);
	});

	it('neredeyse beyaz bir zeminde aciklama en az 4.5:1 kontrast verir', () => {
		const { zemin, aciklama } = paketRenkleri(paket('#F2E9D8', '#EEEDFE'));
		expect(kontrastOrani(aciklama, zemin)).toBeGreaterThanOrEqual(4.5);
	});
});

describe('kaplamaRengi', () => {
	it('koyu zeminde beyaz tabanli rgba verir', () => {
		expect(kaplamaRengi('#111111')).toBe('rgba(255, 255, 255, 0.1)');
	});

	it('acik zeminde siyah tabanli rgba verir', () => {
		expect(kaplamaRengi('#f5f5f5')).toBe('rgba(0, 0, 0, 0.1)');
	});
});
