import type { Soru } from './types';
import type { SaklananSonuc } from './sonuc-aktarim';
import { oran, oranMetni, toplamPuan } from './scoring';

export function paylasimMetni(sonuc: SaklananSonuc, sorular: Soru[]): string {
	const satirlar = sorular.map((soru, i) => {
		const sira = String(i + 1).padStart(2, '0');
		if (soru.mode === 'fermi') {
			return `${sira}  ${oranMetni(oran(sonuc.cevaplar[i], soru.answer))}`;
		}
		return `${sira}  ${sonuc.puanlar[i] > 0 ? '✓' : '✗'}`;
	});

	return [sonuc.baslik, ...satirlar, '─────────', `${toplamPuan(sonuc.puanlar)} puan`].join('\n');
}
