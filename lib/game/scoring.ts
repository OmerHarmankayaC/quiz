import type { Soru } from './types';

export const SLIDER_MAX = 180;

// Kademe 10 birimi temsil eder: 10^((10 - 10) / 10) = 1. Ofset, olcegin 1'in altina
// inmesini saglar - bankada yuzde ve metrekare gibi 1'den kucuk cevaplar var.
const KADEME_OFSETI = 10;

export function sliderDegerine(kademe: number): number {
	return Math.pow(10, (kademe - KADEME_OFSETI) / 10);
}

export function kademeye(deger: number): number {
	if (!Number.isFinite(deger) || deger <= 0) return 0;
	const kademe = Math.round(Math.log10(deger) * 10) + KADEME_OFSETI;
	return Math.min(SLIDER_MAX, Math.max(0, kademe));
}

export function oran(tahmin: number, cevap: number): number {
	if (!Number.isFinite(tahmin) || tahmin <= 0) return Infinity;
	if (!Number.isFinite(cevap) || cevap <= 0) return Infinity;
	return tahmin > cevap ? tahmin / cevap : cevap / tahmin;
}

export function fermiPuan(tahmin: number, cevap: number): number {
	const r = oran(tahmin, cevap);
	if (!Number.isFinite(r)) return 0;
	const ham = 1 - Math.log10(r) / 2;
	return Math.round(100 * Math.min(1, Math.max(0, ham)));
}

export function mcqPuan(secim: number, dogru: number): number {
	return secim === dogru ? 100 : 0;
}

export function soruPuani(soru: Soru, cevap: number): number {
	return soru.mode === 'fermi' ? fermiPuan(cevap, soru.answer) : mcqPuan(cevap, soru.correct_index);
}

export function toplamPuan(puanlar: number[]): number {
	return puanlar.reduce((toplam, p) => toplam + p, 0);
}

export function oranMetni(r: number): string {
	if (!Number.isFinite(r)) return '—';
	if (r < 10) return r.toFixed(2).replace('.', ',') + '×';
	if (r < 100) return r.toFixed(1).replace('.', ',') + '×';
	return Math.round(r).toLocaleString('tr-TR') + '×';
}
