import fermiHam from '@/data/bank/fermi.json';
import mcqHam from '@/data/bank/mcq.json';
import packsHam from '@/data/bank/packs.json';
import calendarHam from '@/data/bank/calendar.json';
import type { FermiSoru, McqSoru, Paket, Soru, TakvimGunu } from './types';

export const TUM_SORULAR: Soru[] = [
	...(fermiHam as FermiSoru[]),
	...(mcqHam as McqSoru[])
];

export const SORU_DIZINI: Map<string, Soru> = new Map(TUM_SORULAR.map((s) => [s.id, s]));

export const PAKETLER: Paket[] = packsHam as Paket[];

export const TAKVIM: TakvimGunu[] = calendarHam as TakvimGunu[];

export function sorulariGetir(ids: string[]): Soru[] {
	return ids.map((id) => {
		const soru = SORU_DIZINI.get(id);
		if (!soru) throw new Error(`bankada olmayan soru: ${id}`);
		return soru;
	});
}

export function paketiGetir(slug: string): Paket | null {
	return PAKETLER.find((p) => p.slug === slug) ?? null;
}
