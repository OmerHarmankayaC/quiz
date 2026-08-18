import type { Soru } from './types';

export interface Hesap {
	baslik: string;
	lead?: string;
	rows: [string, string][];
}

// napkin oyuncunun sifirdan nasil akil yurutecegini anlatir - asil ogretici icerik odur.
// math gercek cevabin nasil turetildigini anlatir. Ikisi birden gosterilmez: yan yana
// konunca sonuc ekrani iki rakip hesapla kalabaliklasiyor.
export function hesabiSec(soru: Soru): Hesap | null {
	if (soru.mode !== 'fermi') return null;

	if (soru.napkin && soru.napkin.rows.length > 0) {
		return { baslik: 'Peçete hesabı', lead: soru.napkin.lead, rows: soru.napkin.rows };
	}

	if (soru.math && soru.math.length > 0) {
		return { baslik: 'Nasıl hesaplanıyor', rows: soru.math };
	}

	return null;
}
