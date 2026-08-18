import { describe, it, expect } from 'vitest';
import { doygunluguDusur, karistir, paketRenkleri } from '@/lib/game/renk';
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
			metin: '#b6b4cc'
		});
		expect(paketRenkleri(paket('#10322E', '#E3F5EE'))).toEqual({
			zemin: '#172f2c',
			metin: '#aabeb8'
		});
		expect(paketRenkleri(paket('#1B2A3A', '#E4F0FA'))).toEqual({
			zemin: '#1f2934',
			metin: '#adb8c3'
		});
	});
});
