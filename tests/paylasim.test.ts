import { describe, it, expect } from 'vitest';
import { paylasimMetni } from '@/lib/game/paylasim';
import type { FermiSoru, McqSoru } from '@/lib/game/types';
import type { SaklananSonuc } from '@/lib/game/sonuc-aktarim';

const fermi: FermiSoru = {
	id: 'f1',
	mode: 'fermi',
	prompt: 'kac?',
	topics: [],
	difficulty: 1,
	source: 's',
	origin: 'original',
	verified_at: '2026-08',
	answer: 100,
	unit: 'adet',
	kaynak_soru: 'q1'
};

const mcq: McqSoru = {
	id: 'm1',
	mode: 'mcq',
	prompt: 'hangisi?',
	topics: [],
	difficulty: 1,
	source: 's',
	origin: 'wiki',
	verified_at: '2026-08',
	choices: ['a', 'b', 'c', 'd'],
	correct_index: 2,
	explanation: 'cunku',
	kaynak_id: 'k1',
	kaynak_baslik: 'Kaynak'
};

const sonuc: SaklananSonuc = {
	baslik: 'Kaç? · No. 23',
	kaynak: 'gunluk',
	slug: '2026-08-17',
	soruIdler: ['f1', 'm1'],
	cevaplar: [200, 2],
	puanlar: [85, 100]
};

describe('paylasimMetni', () => {
	const metin = paylasimMetni(sonuc, [fermi, mcq]);

	it('baslikla baslar', () => {
		expect(metin.split('\n')[0]).toBe('Kaç? · No. 23');
	});

	it('fermi sorusunu sapmayla yazar', () => {
		expect(metin).toContain('01  2,00×');
	});

	it('mcq sorusunu isaretle yazar', () => {
		expect(metin).toContain('02  ✓');
	});

	it('toplam puani yazar', () => {
		expect(metin).toContain('185 puan');
	});

	it('yanlis mcq icin capraz isaret koyar', () => {
		const yanlis = { ...sonuc, cevaplar: [200, 0], puanlar: [85, 0] };
		expect(paylasimMetni(yanlis, [fermi, mcq])).toContain('02  ✗');
	});
});
