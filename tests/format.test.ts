import { describe, it, expect } from 'vitest';
import { sayiMetni } from '@/lib/game/format';

describe('sayiMetni', () => {
	it('milyon esigini turkce yazar', () => {
		expect(sayiMetni(2_500_000)).toBe('2,5 milyon');
		expect(sayiMetni(75_000_000)).toBe('75 milyon');
	});

	it('bin ve milyar esiklerini yazar', () => {
		expect(sayiMetni(1_000)).toBe('1 bin');
		expect(sayiMetni(3_200_000_000)).toBe('3,2 milyar');
	});

	it('kucuk sayilari oldugu gibi verir', () => {
		expect(sayiMetni(130)).toBe('130');
		expect(sayiMetni(8.5)).toBe('8,5');
	});

	it('sonlu olmayan sayi icin tire verir', () => {
		expect(sayiMetni(Infinity)).toBe('—');
	});
});
