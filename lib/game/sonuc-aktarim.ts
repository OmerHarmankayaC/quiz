export interface SaklananSonuc {
	baslik: string;
	kaynak: 'gunluk' | 'paket';
	slug: string;
	soruIdler: string[];
	cevaplar: number[];
	puanlar: number[];
}

const ANAHTAR = 'kac:son-sonuc';

export function sonucuSakla(sonuc: SaklananSonuc): void {
	if (typeof sessionStorage === 'undefined') return;
	try {
		sessionStorage.setItem(ANAHTAR, JSON.stringify(sonuc));
	} catch {
		// gizli mod - sonuc ekrani bos gelir, oyun devam eder
	}
}

export function sonucuAl(): SaklananSonuc | null {
	if (typeof sessionStorage === 'undefined') return null;
	try {
		const ham = sessionStorage.getItem(ANAHTAR);
		return ham ? (JSON.parse(ham) as SaklananSonuc) : null;
	} catch {
		return null;
	}
}
