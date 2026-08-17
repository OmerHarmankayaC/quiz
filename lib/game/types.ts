export type SoruTipi = 'fermi' | 'mcq';
export type Zorluk = 1 | 2 | 3;
export type Koken = 'translated' | 'adapted' | 'original' | 'wiki';

export interface OrtakSoru {
	id: string;
	mode: SoruTipi;
	prompt: string;
	topics: string[];
	difficulty: Zorluk;
	source: string;
	origin: Koken;
	verified_at: string;
}

export interface Napkin {
	type?: string;
	lead: string;
	rows: [string, string][];
}

export interface FermiSoru extends OrtakSoru {
	mode: 'fermi';
	answer: number;
	unit: string;
	kaynak_soru: string;
	donusum?: string;
	math?: [string, string][];
	napkin?: Napkin;
	_math_en?: [string, string][];
	_napkin_en?: Napkin;
}

export interface McqSoru extends OrtakSoru {
	mode: 'mcq';
	choices: [string, string, string, string];
	correct_index: 0 | 1 | 2 | 3;
	explanation: string;
	kaynak_id: string;
	kaynak_baslik: string;
}

export type Soru = FermiSoru | McqSoru;

export interface Paket {
	slug: string;
	baslik: string;
	renk: string;
	metin_rengi: string;
	soru_ids: string[];
}

export interface TakvimGunu {
	tarih: string;
	no: number;
	soru_ids: string[];
}
