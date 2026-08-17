export interface OyunSonucu {
	soruId: string;
	cevap: number;
	puan: number;
}

export function sonrakiDurum(mevcut: number, toplam: number): 'devam' | 'bitti' {
	return mevcut + 1 < toplam ? 'devam' : 'bitti';
}
