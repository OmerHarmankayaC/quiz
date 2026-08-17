import { oncekiGun } from './daily';

const ANAHTAR = 'kac:v1';

export interface PaketKaydi {
	enIyi: number;
	tamamlandi: string;
}

export interface OyunKaydi {
	streak: number;
	sonOynananGun: string | null;
	gunluk: Record<string, number>;
	paketler: Record<string, PaketKaydi>;
}

export const BOS_KAYIT: OyunKaydi = {
	streak: 0,
	sonOynananGun: null,
	gunluk: {},
	paketler: {}
};

function nesneMi(d: unknown): d is Record<string, unknown> {
	return typeof d === 'object' && d !== null && !Array.isArray(d);
}

function gecerliKayitMi(d: unknown): d is OyunKaydi {
	if (!nesneMi(d)) return false;
	if (typeof d.streak !== 'number' || !Number.isFinite(d.streak)) return false;
	if (d.sonOynananGun !== null && typeof d.sonOynananGun !== 'string') return false;
	if (!nesneMi(d.gunluk) || !nesneMi(d.paketler)) return false;
	return true;
}

export function kaydiOku(): OyunKaydi {
	if (typeof localStorage === 'undefined') return BOS_KAYIT;
	try {
		const ham = localStorage.getItem(ANAHTAR);
		if (!ham) return BOS_KAYIT;
		const cozulmus: unknown = JSON.parse(ham);
		return gecerliKayitMi(cozulmus) ? cozulmus : BOS_KAYIT;
	} catch {
		return BOS_KAYIT;
	}
}

export function kaydiYaz(kayit: OyunKaydi): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(ANAHTAR, JSON.stringify(kayit));
	} catch {
		// kota dolu veya gizli mod - oyun kayitsiz devam eder
	}
}

export function gunuKaydet(kayit: OyunKaydi, tarih: string, puan: number): OyunKaydi {
	const ayniGun = kayit.sonOynananGun === tarih;
	const ardisik = kayit.sonOynananGun === oncekiGun(tarih);
	const streak = ayniGun ? kayit.streak : ardisik ? kayit.streak + 1 : 1;

	return {
		...kayit,
		streak,
		sonOynananGun: tarih,
		gunluk: { ...kayit.gunluk, [tarih]: Math.max(kayit.gunluk[tarih] ?? 0, puan) }
	};
}

export function paketiKaydet(
	kayit: OyunKaydi,
	slug: string,
	puan: number,
	zaman: string
): OyunKaydi {
	const onceki = kayit.paketler[slug];
	if (onceki && onceki.enIyi >= puan) return kayit;

	return {
		...kayit,
		paketler: { ...kayit.paketler, [slug]: { enIyi: puan, tamamlandi: zaman } }
	};
}
