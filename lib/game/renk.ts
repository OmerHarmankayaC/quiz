import type { Paket } from './types';

// Paket renkleri data/bank/packs.json icinde ve orasi soru bankasi hattinin
// alani. Mat palet veriye dokunmadan burada turetiliyor; yeni paket eklendiginde
// kendiliginden uyar.
const DOYGUNLUK_DUSUSU = 0.3;
const METIN_KARISIMI = 0.28;
const KONTRAST_TABANI = 4.5;
const KARISIM_ADIMI = 0.02;

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

function goreliParlaklik(hex: string): number {
	const [r, g, b] = hexToRgb(hex);
	const kanal = (v: number) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * kanal(r) + 0.7152 * kanal(g) + 0.0722 * kanal(b);
}

// WCAG kontrast orani: (L1+0.05)/(L2+0.05), L1 daha parlak olan.
export function kontrastOrani(a: string, b: string): number {
	const l1 = goreliParlaklik(a);
	const l2 = goreliParlaklik(b);
	const parlak = Math.max(l1, l2);
	const koyu = Math.min(l1, l2);
	return (parlak + 0.05) / (koyu + 0.05);
}

// Rozet ve haptaki pill icin yaricı zemin katmani. Koyu zeminde beyaz,
// acik zeminde siyah -- aksi halde acik bir paket uzerinde katman kaybolur.
export function kaplamaRengi(zemin: string): string {
	return goreliParlaklik(zemin) < 0.5 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
}

export function paketRenkleri(paket: Paket): { zemin: string; metin: string } {
	const zemin = doygunluguDusur(paket.renk, DOYGUNLUK_DUSUSU);
	// Mat his kontrastin dusmesinden geliyor: metin griye degil, zemine dogru kisiliyor.
	// Ama bu kisilma WCAG 4.5:1'in altina dusemez -- orta tonlu ya da acik bir paket
	// renginde baslik okunmaz hale gelmesin diye karisim orani asamali dusuruluyor.
	let karisimOrani = METIN_KARISIMI;
	let metin = karistir(paket.metin_rengi, zemin, karisimOrani);

	while (kontrastOrani(metin, zemin) < KONTRAST_TABANI && karisimOrani > 0) {
		karisimOrani = Math.max(0, karisimOrani - KARISIM_ADIMI);
		metin = karistir(paket.metin_rengi, zemin, karisimOrani);
	}

	if (kontrastOrani(metin, zemin) < KONTRAST_TABANI) {
		const beyazKontrast = kontrastOrani('#ffffff', zemin);
		const siyahKontrast = kontrastOrani('#0b0b0b', zemin);
		metin = beyazKontrast >= siyahKontrast ? '#ffffff' : '#0b0b0b';
	}

	return { zemin, metin };
}
