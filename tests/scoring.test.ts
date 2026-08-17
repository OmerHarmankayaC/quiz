import { describe, it, expect } from 'vitest';
import {
	SLIDER_MAX,
	sliderDegerine,
	kademeye,
	tahminiYuvarla,
	oran,
	fermiPuan,
	mcqPuan,
	soruPuani,
	toplamPuan,
	oranMetni
} from '@/lib/game/scoring';
import type { FermiSoru, McqSoru } from '@/lib/game/types';

describe('slider donusumu', () => {
	it('kademe 0 en kucuk degeri verir', () => {
		expect(sliderDegerine(0)).toBeCloseTo(0.1, 10);
	});

	it('kademe 10 degeri 1 verir', () => {
		expect(sliderDegerine(10)).toBeCloseTo(1, 10);
	});

	it('ust kademe 10^17 verir', () => {
		expect(sliderDegerine(SLIDER_MAX) / 1e17).toBeCloseTo(1, 6);
	});

	it('kademeye ve sliderDegerine birbirinin tersi', () => {
		expect(kademeye(sliderDegerine(43))).toBe(43);
		expect(kademeye(sliderDegerine(173))).toBe(173);
	});

	it('bankanin uc degerleri menzile sigar', () => {
		expect(kademeye(0.1)).toBe(0);
		expect(kademeye(2e16)).toBe(173);
		expect(sliderDegerine(kademeye(2e16))).toBeGreaterThan(1e16);
	});

	it('menzil disi girdiyi sinirlara kilitler', () => {
		expect(kademeye(0.001)).toBe(0);
		expect(kademeye(1e30)).toBe(SLIDER_MAX);
	});

	it('gecersiz girdi 0 verir', () => {
		expect(kademeye(0)).toBe(0);
		expect(kademeye(-5)).toBe(0);
		expect(kademeye(NaN)).toBe(0);
	});
});

describe('tahminiYuvarla', () => {
	it('bir onceki degerdeki alt uc degerleri korur', () => {
		expect(tahminiYuvarla(0.1)).toBe(0.1);
		expect(tahminiYuvarla(0.67)).toBe(0.67);
		expect(tahminiYuvarla(2.5)).toBe(2.5);
	});

	it('uc anlamli basamaga yuvarlar', () => {
		expect(tahminiYuvarla(999.4)).toBe(999);
	});

	it('1000 ve ustunu tamsayiya yuvarlar', () => {
		expect(tahminiYuvarla(1234567)).toBe(1234567);
	});

	it('gecersiz girdi 0 verir', () => {
		expect(tahminiYuvarla(0)).toBe(0);
		expect(tahminiYuvarla(-5)).toBe(0);
		expect(tahminiYuvarla(NaN)).toBe(0);
	});

	it('slider menzilindeki her kademe sifirdan buyuk deger uretir', () => {
		for (let k = 0; k <= SLIDER_MAX; k++) {
			expect(tahminiYuvarla(sliderDegerine(k))).toBeGreaterThan(0);
		}
	});
});

describe('oran', () => {
	it('yon fark etmez', () => {
		expect(oran(200, 100)).toBe(2);
		expect(oran(100, 200)).toBe(2);
	});

	it('sifir ve negatif tahmin sonsuz verir', () => {
		expect(oran(0, 100)).toBe(Infinity);
		expect(oran(-5, 100)).toBe(Infinity);
	});

	it('sonlu olmayan girdi sonsuz verir', () => {
		expect(oran(NaN, 100)).toBe(Infinity);
		expect(oran(Infinity, 100)).toBe(Infinity);
	});
});

describe('fermiPuan', () => {
	it('tam isabet 100 verir', () => {
		expect(fermiPuan(100, 100)).toBe(100);
	});

	it('bilinen oranlarda beklenen puanlari verir', () => {
		expect(fermiPuan(120, 100)).toBe(96);
		expect(fermiPuan(150, 100)).toBe(91);
		expect(fermiPuan(200, 100)).toBe(85);
		expect(fermiPuan(500, 100)).toBe(65);
		expect(fermiPuan(1000, 100)).toBe(50);
	});

	it('100 kat ve otesi 0 verir', () => {
		expect(fermiPuan(10_000, 100)).toBe(0);
		expect(fermiPuan(100_000, 100)).toBe(0);
	});

	it('gecersiz tahmin 0 verir', () => {
		expect(fermiPuan(0, 100)).toBe(0);
		expect(fermiPuan(-1, 100)).toBe(0);
	});
});

describe('mcqPuan', () => {
	it('dogru secim 100, yanlis 0', () => {
		expect(mcqPuan(2, 2)).toBe(100);
		expect(mcqPuan(1, 2)).toBe(0);
	});
});

describe('soruPuani', () => {
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

	it('tipe gore dogru fonksiyona yonlenir', () => {
		expect(soruPuani(fermi, 200)).toBe(85);
		expect(soruPuani(mcq, 2)).toBe(100);
		expect(soruPuani(mcq, 0)).toBe(0);
	});
});

describe('toplamPuan', () => {
	it('puanlari toplar', () => {
		expect(toplamPuan([100, 85, 0])).toBe(185);
	});

	it('bos dizi 0 verir', () => {
		expect(toplamPuan([])).toBe(0);
	});
});

describe('oranMetni', () => {
	it('turkce ondalik ayirici kullanir', () => {
		expect(oranMetni(1.34)).toBe('1,34×');
		expect(oranMetni(42.5)).toBe('42,5×');
	});

	it('buyuk oranlari yuvarlar', () => {
		expect(oranMetni(1234.6)).toBe('1.235×');
	});

	it('sonsuz icin tire verir', () => {
		expect(oranMetni(Infinity)).toBe('—');
	});
});
