import { describe, it, expect } from 'vitest';
import {
	TUM_SORULAR,
	SORU_DIZINI,
	PAKETLER,
	TAKVIM,
	sorulariGetir,
	paketiGetir
} from '@/lib/game/bank';
import { takvimHatalari } from '@/lib/game/daily';

describe('banka yuklenmesi', () => {
	it('soru bankasi bos degil', () => {
		expect(TUM_SORULAR.length).toBeGreaterThan(0);
	});

	it('hem fermi hem mcq sorusu tasir', () => {
		expect(TUM_SORULAR.some((s) => s.mode === 'fermi')).toBe(true);
		expect(TUM_SORULAR.some((s) => s.mode === 'mcq')).toBe(true);
	});

	it('kimlikler tekil', () => {
		const idler = new Set(TUM_SORULAR.map((s) => s.id));
		expect(idler.size).toBe(TUM_SORULAR.length);
	});

	it('dizin her soruyu id ile bulur', () => {
		for (const s of TUM_SORULAR) {
			expect(SORU_DIZINI.get(s.id)).toBe(s);
		}
	});
});

describe('paketler', () => {
	it('en az bir paket vardir', () => {
		expect(PAKETLER.length).toBeGreaterThan(0);
	});

	it('her paketin sorulari bankada cozulebilir', () => {
		for (const p of PAKETLER) {
			expect(sorulariGetir(p.soru_ids)).toHaveLength(p.soru_ids.length);
		}
	});

	it('paket slug lari tekil', () => {
		const slugler = new Set(PAKETLER.map((p) => p.slug));
		expect(slugler.size).toBe(PAKETLER.length);
	});

	it('her paketin kapak icin gerekli alanlari dolu', () => {
		for (const p of PAKETLER) {
			expect(p.baslik.length).toBeGreaterThan(0);
			expect(p.renk).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(p.metin_rengi).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});

	it('paketiGetir slug ile bulur, yoksa null verir', () => {
		expect(paketiGetir(PAKETLER[0].slug)).toBe(PAKETLER[0]);
		expect(paketiGetir('boyle-bir-paket-yok')).toBeNull();
	});
});

describe('takvim', () => {
	it('takvim gecerlidir', () => {
		expect(takvimHatalari(TAKVIM)).toEqual([]);
	});

	it('takvimdeki her soru bankada vardir', () => {
		for (const gun of TAKVIM) {
			expect(sorulariGetir(gun.soru_ids)).toHaveLength(3);
		}
	});

	it('gun numaralari tekil ve artan', () => {
		const numaralar = TAKVIM.map((g) => g.no);
		expect(new Set(numaralar).size).toBe(numaralar.length);
		expect([...numaralar].sort((a, b) => a - b)).toEqual(numaralar);
	});
});

describe('sorulariGetir', () => {
	it('sirayi korur', () => {
		const ids = TUM_SORULAR.slice(0, 3).map((s) => s.id);
		expect(sorulariGetir(ids).map((s) => s.id)).toEqual(ids);
	});

	it('bulunamayan id hata firlatir', () => {
		expect(() => sorulariGetir(['boyle-bir-soru-yok'])).toThrow(
			'bankada olmayan soru: boyle-bir-soru-yok'
		);
	});
});
