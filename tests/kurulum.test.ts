import { describe, it, expect } from 'vitest';
import { SLIDER_MAX } from '@/lib/game/scoring';

describe('kurulum', () => {
	it('@ alias proje kokune cozulur', () => {
		expect(SLIDER_MAX).toBe(60);
	});

	it('jsdom ortami localStorage saglar', () => {
		localStorage.setItem('x', '1');
		expect(localStorage.getItem('x')).toBe('1');
		localStorage.clear();
	});
});
