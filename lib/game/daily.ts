import type { TakvimGunu } from './types';

const TR_TARIH = new Intl.DateTimeFormat('en-CA', {
	timeZone: 'Europe/Istanbul',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

export function bugununTarihi(simdi: Date = new Date()): string {
	return TR_TARIH.format(simdi);
}

export function gunuBul(takvim: TakvimGunu[], tarih: string): TakvimGunu | null {
	return takvim.find((g) => g.tarih === tarih) ?? null;
}

export function oncekiGun(tarih: string): string {
	const d = new Date(tarih + 'T00:00:00Z');
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

export function takvimHatalari(takvim: TakvimGunu[]): string[] {
	const hatalar: string[] = [];
	const gorulenTarihler = new Set<string>();
	const gorulenSorular = new Map<string, string>();

	for (const gun of takvim) {
		if (gorulenTarihler.has(gun.tarih)) {
			hatalar.push(`tekrar eden tarih: ${gun.tarih}`);
		}
		gorulenTarihler.add(gun.tarih);

		if (gun.soru_ids.length !== 3) {
			hatalar.push(`${gun.tarih} gununde 3 yerine ${gun.soru_ids.length} soru var`);
		}

		const gunIci = new Set<string>();
		for (const id of gun.soru_ids) {
			if (gunIci.has(id)) {
				hatalar.push(`${gun.tarih} gununde ayni soru iki kez: ${id}`);
			}
			gunIci.add(id);

			const oncekiTarih = gorulenSorular.get(id);
			if (oncekiTarih && oncekiTarih !== gun.tarih) {
				hatalar.push(`soru birden fazla gunde: ${id}`);
			}
			gorulenSorular.set(id, gun.tarih);
		}
	}

	return hatalar;
}
