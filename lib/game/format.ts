const ESIKLER: [number, string][] = [
	[1e9, 'milyar'],
	[1e6, 'milyon'],
	[1e3, 'bin']
];

export function sayiMetni(n: number): string {
	if (!Number.isFinite(n)) return '—';
	for (const [esik, ad] of ESIKLER) {
		if (n >= esik) {
			const d = n / esik;
			const yazi = d < 10 ? d.toFixed(1).replace(/\.0$/, '') : String(Math.round(d));
			return yazi.replace('.', ',') + ' ' + ad;
		}
	}
	return String(Math.round(n * 100) / 100).replace('.', ',');
}
