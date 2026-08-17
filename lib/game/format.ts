const ESIKLER: [number, string][] = [
	[1e15, 'katrilyon'],
	[1e12, 'trilyon'],
	[1e9, 'milyar'],
	[1e6, 'milyon'],
	[1e3, 'bin']
];

export function sayiMetni(n: number): string {
	if (!Number.isFinite(n)) return '—';
	for (const [esik, ad] of ESIKLER) {
		if (n >= esik) {
			const d = n / esik;
			// d >= 10 dalinda tr-TR gruplamasi kullanilir; bu dalin ciktisinda nokta
			// binlik ayraci oldugu icin virgule cevrilmemeli.
			const yazi =
				d < 10
					? d.toFixed(1).replace(/\.0$/, '').replace('.', ',')
					: Math.round(d).toLocaleString('tr-TR');
			return yazi + ' ' + ad;
		}
	}
	return String(Math.round(n * 100) / 100).replace('.', ',');
}

// Turkce yazilmis bir sayiyi cozer. Nokta binlik ayraci, virgul ondalik ayracidir;
// ancak kullanicilar JS gosterimini de yazabildigi icin tek nokta + ucten farkli
// uzunlukta kesir ("0.1", "1.5") ondalik sayilir. Cozulemeyen metin null verir -
// cagiran taraf onceki degeri korumalidir, baska bir sayiya sessizce cevirmemelidir.
export function sayiCozumle(metin: string): number | null {
	const temiz = metin.replace(/\s/g, '');
	if (temiz === '') return null;

	let duz: string;
	if (temiz.includes(',')) {
		duz = temiz.replace(/\./g, '').replace(',', '.');
	} else {
		const parcalar = temiz.split('.');
		const tekNokta = parcalar.length === 2;
		const ucBasamak = tekNokta && /^\d{3}$/.test(parcalar[1]);
		duz = tekNokta && !ucBasamak ? temiz : temiz.replace(/\./g, '');
	}

	const sayi = Number(duz);
	if (!Number.isFinite(sayi) || sayi <= 0) return null;
	return sayi;
}
