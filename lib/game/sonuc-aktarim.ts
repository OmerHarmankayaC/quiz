export interface SaklananSonuc {
	baslik: string;
	soruIdler: string[];
	cevaplar: number[];
	puanlar: number[];
}

const ANAHTAR = 'kac:son-sonuc';

function nesneMi(d: unknown): d is Record<string, unknown> {
	return typeof d === 'object' && d !== null && !Array.isArray(d);
}

function metinDizisiMi(d: unknown): boolean {
	return Array.isArray(d) && d.every((e) => typeof e === 'string');
}

function sayiDizisiMi(d: unknown): boolean {
	return Array.isArray(d) && d.every((e) => typeof e === 'number' && Number.isFinite(e));
}

function gecerliSonucMu(d: unknown): d is SaklananSonuc {
	if (!nesneMi(d)) return false;
	if (typeof d.baslik !== 'string') return false;
	if (!metinDizisiMi(d.soruIdler)) return false;
	if (!sayiDizisiMi(d.cevaplar) || !sayiDizisiMi(d.puanlar)) return false;
	return true;
}

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
		if (!ham) return null;
		const cozulmus: unknown = JSON.parse(ham);
		// Dogrulanmamis bir nesne /sonuc ekranini patlatir; suphede kalinca null.
		return gecerliSonucMu(cozulmus) ? cozulmus : null;
	} catch {
		return null;
	}
}
