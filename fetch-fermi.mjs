#!/usr/bin/env node
// fermi.gg soru bankasi cikarici.
//
// Site bir SvelteKit SPA ve soru verisi ayri bir API'de degil, uygulama
// bundle'ina gomulu duruyor. Bu yuzden akis su: /archive sayfasini cek, oradaki
// _app chunk listesini topla, icinde soru datasi olan chunk'i bul, o chunk'a iki
// export satiri ekleyip Node'da import et. Bundle hash'leri her deploy'da
// degistigi icin hicbir dosya adi sabit yazilmadi; hepsi HTML'den kesfediliyor.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const BASE = 'https://fermi.gg';
const OUT = join(dirname(fileURLToPath(import.meta.url)), 'data');
const UA =
	'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

// curl uzerinden cekiyoruz: Cloudflare onunde Node'un undici fetch'i bazi
// ortamlarda TLS seviyesinde resetleniyor, curl her yerde calisiyor.
const get = async (path) => {
	const { stdout } = await execFileAsync(
		'curl',
		['-sS', '--fail', '--compressed', '-m', '30', '-A', UA, BASE + path],
		{ maxBuffer: 64 * 1024 * 1024 }
	);
	return stdout;
};

// --- 1. Data chunk'ini getir ----------------------------------------------
// Indirilen chunk data/.bundle-raw.js'e saklaniyor. Cloudflare art arda
// isteklerde rate-limit uygulayabildigi icin varsayilan davranis cache'i
// kullanmak; taze veri icin --refresh ver.

await mkdir(OUT, { recursive: true });
const rawPath = join(OUT, '.bundle-raw.js');
const refresh = process.argv.includes('--refresh');

let dataChunk = null;

if (!refresh) {
	const cached = await readFile(rawPath, 'utf8').catch(() => null);
	if (cached) {
		dataChunk = { url: '(cache: data/.bundle-raw.js)', src: cached };
		console.log('cache kullaniliyor - taze cekim icin: node fetch-fermi.mjs --refresh');
	}
}

if (!dataChunk) {
	const html = await get('/archive');
	const chunks = [...new Set(html.match(/\/_app\/immutable\/[a-z]+\/[\w.\-]+\.js/g) ?? [])];
	if (!chunks.length) throw new Error('bundle chunk listesi bulunamadi - site yapisi degismis olabilir');
	console.log(`${chunks.length} chunk bulundu`);

	// Ayirt edici imza: yuzlerce `prompt:` alani ve `{id:"qN"` ile baslayan dizi.
	for (const url of chunks) {
		const src = await get(url);
		if ((src.match(/prompt:/g) ?? []).length > 50 && /=\[\{id:"q1"/.test(src)) {
			dataChunk = { url, src };
			await writeFile(rawPath, src);
			break;
		}
	}
	if (!dataChunk) throw new Error('soru datasi iceren chunk bulunamadi');
}

console.log(`data chunk: ${dataChunk.url}`);

// --- 3. Minified degisken adlarini yakala ---------------------------------
// Ikisi de export edilmiyor, bu yuzden isimlerini kaynaktan okuyup kendi export
// satirimizi ekliyoruz. Isimler her build'de degisir; regex yapiya bakiyor.

const poolVar = dataChunk.src.match(/(\w+)=\[\{id:"q1"/)?.[1];
const calVar = dataChunk.src.match(/(\w+)=\{"\d{4}-\d{2}-\d{2}":\{dateStr:/)?.[1];
if (!poolVar || !calVar) throw new Error(`degisken adlari cozulemedi (pool=${poolVar} cal=${calVar})`);
console.log(`degiskenler: havuz=${poolVar} takvim=${calVar}`);

// --- 4. Patch'leyip import et ---------------------------------------------
// Chunk top-level'da moment.js kuruyor ve tarayici global'lerine dokunuyor,
// o yuzden minimal bir shim yetiyor. navigator yazilamaz, dokunmuyoruz.

const modPath = join(OUT, '.bundle.mjs');
await writeFile(modPath, `${dataChunk.src}\nexport{${poolVar} as POOL,${calVar} as CALENDAR};\n`);

globalThis.window = globalThis;
globalThis.document = {
	documentElement: { dataset: {} },
	querySelector: () => null,
	createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
	addEventListener() {},
	head: { appendChild() {} }
};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };

const { POOL, CALENDAR } = await import(pathToFileURL(modPath).href);

// --- 5. Yayin bilgisini sorularla birlestir -------------------------------

const published = new Map();
for (const [dateKey, day] of Object.entries(CALENDAR)) {
	day.questions.forEach((qid, i) => published.set(qid, { dateKey, slot: i + 1 }));
}

const questions = POOL.map((q) => {
	const pub = published.get(q.id);
	return {
		id: q.id,
		prompt: q.prompt,
		answer: q.answer,
		unit: q.unit,
		icon: q.icon ?? null,
		source: q.source ?? null,
		confidence: q.confidence ?? null,
		published_date: pub?.dateKey ?? null,
		published_slot: pub?.slot ?? null,
		math: q.math ?? null,
		napkin: q.napkin ?? null,
		flags: q.flags ?? null,
		distribution: q.distribution ?? null
	};
});

const calendar = Object.entries(CALENDAR)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([dateKey, day], i) => ({
		puzzle_no: i + 1,
		date: dateKey,
		date_str: day.dateStr,
		question_ids: day.questions,
		questions: day.questions.map((qid) => {
			const q = POOL.find((x) => x.id === qid);
			return q ? { id: q.id, prompt: q.prompt, answer: q.answer, unit: q.unit } : { id: qid };
		})
	}));

// --- 6. Yaz ----------------------------------------------------------------

const csvCell = (v) => (v == null ? '' : `"${String(v).replace(/"/g, '""')}"`);
const cols = ['id', 'prompt', 'answer', 'unit', 'source', 'confidence', 'published_date', 'published_slot'];
const csv = [cols.join(','), ...questions.map((q) => cols.map((c) => csvCell(q[c])).join(','))].join('\n');

await writeFile(join(OUT, 'questions.json'), JSON.stringify(questions, null, 2));
await writeFile(join(OUT, 'questions.csv'), csv + '\n');
await writeFile(join(OUT, 'calendar.json'), JSON.stringify(calendar, null, 2));

const publishedCount = questions.filter((q) => q.published_date).length;
console.log(
	`\nyazildi -> ${OUT}\n  questions.json / questions.csv : ${questions.length} soru (${publishedCount} yayinlanmis, ${questions.length - publishedCount} havuzda bekliyor)\n  calendar.json                 : ${calendar.length} gunluk puzzle`
);
