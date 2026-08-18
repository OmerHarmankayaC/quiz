import type { Paket } from './types';

// Paket renkleri data/bank/packs.json icinde ve orasi soru bankasi hattinin
// alani. Mat palet veriye dokunmadan burada turetiliyor; yeni paket eklendiginde
// kendiliginden uyar.
const DOYGUNLUK_DUSUSU = 0.3;
const METIN_KARISIMI = 0.28;

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16)
	];
}

function rgbToHex(r: number, g: number, b: number): string {
	const bilesen = (v: number) =>
		Math.round(Math.max(0, Math.min(255, v)))
			.toString(16)
			.padStart(2, '0');
	return '#' + bilesen(r) + bilesen(g) + bilesen(b);
}

export function doygunluguDusur(hex: string, k: number): string {
	const [r, g, b] = hexToRgb(hex);
	const gri = 0.299 * r + 0.587 * g + 0.114 * b;
	return rgbToHex(r + (gri - r) * k, g + (gri - g) * k, b + (gri - b) * k);
}

export function karistir(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function paketRenkleri(paket: Paket): { zemin: string; metin: string } {
	const zemin = doygunluguDusur(paket.renk, DOYGUNLUK_DUSUSU);
	// Mat his kontrastin dusmesinden geliyor: metin griye degil, zemine dogru kisiliyor.
	return { zemin, metin: karistir(paket.metin_rengi, zemin, METIN_KARISIMI) };
}
