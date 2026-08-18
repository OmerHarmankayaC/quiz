import { describe, it, expect } from 'vitest';
import { hesabiSec } from '@/lib/game/hesap';
import type { FermiSoru, McqSoru } from '@/lib/game/types';

const temelFermi: FermiSoru = {
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
	kaynak_baslik: 'K'
};

describe('hesabiSec', () => {
	it('napkin varsa onu secer ve lead tasir', () => {
		const soru: FermiSoru = {
			...temelFermi,
			napkin: { lead: 'kurarak git', rows: [['a', '1']] },
			math: [['b', '2']]
		};
		expect(hesabiSec(soru)).toEqual({
			baslik: 'Peçete hesabı',
			lead: 'kurarak git',
			rows: [['a', '1']]
		});
	});

	it('napkin yoksa math secilir ve lead tasimaz', () => {
		const soru: FermiSoru = { ...temelFermi, math: [['b', '2']] };
		expect(hesabiSec(soru)).toEqual({
			baslik: 'Nasıl hesaplanıyor',
			rows: [['b', '2']]
		});
	});

	it('ikisi de yoksa null verir', () => {
		expect(hesabiSec(temelFermi)).toBeNull();
	});

	it('bos rows tasiyan napkin secilmez, math yedege duser', () => {
		const soru: FermiSoru = {
			...temelFermi,
			napkin: { lead: 'x', rows: [] },
			math: [['b', '2']]
		};
		expect(hesabiSec(soru)?.baslik).toBe('Nasıl hesaplanıyor');
	});

	it('mcq sorusu icin null verir', () => {
		expect(hesabiSec(mcq)).toBeNull();
	});
});
