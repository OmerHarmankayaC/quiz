import { describe, it, expect } from 'vitest';
import { sonrakiDurum } from '@/lib/game/akis';

describe('sonrakiDurum', () => {
	it('son sorudan onceyse devam eder', () => {
		expect(sonrakiDurum(0, 3)).toBe('devam');
		expect(sonrakiDurum(1, 3)).toBe('devam');
	});

	it('son soruda biter', () => {
		expect(sonrakiDurum(2, 3)).toBe('bitti');
	});

	it('tek soruluk oyunda hemen biter', () => {
		expect(sonrakiDurum(0, 1)).toBe('bitti');
	});
});
