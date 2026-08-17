# Kaç? — Oyun ve Arayüz Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** fermi.gg mantığında çalışan, Türkçe içerikli, karanlık temalı bir tahmin oyununu statik bir web uygulaması olarak kurmak.

**Architecture:** Bütün oyun kuralı `lib/game/` altındaki saf, DOM'suz modüllerde. React bileşenleri yalnızca sunum yapar, puan hesaplamaz. Veri derleme anında JSON olarak paketlenir; çalışma zamanında sunucu yoktur, kalıcılık localStorage'dadır.

**Tech Stack:** Next.js 15 (App Router, `output: 'export'`), TypeScript, Tailwind v4, Vitest + jsdom.

**Spec:** [2026-08-17-oyun-ve-arayuz-design.md](../specs/2026-08-17-oyun-ve-arayuz-design.md)

## Global Constraints

- Statik çıktı zorunlu: `output: 'export'`. Sunucu bileşeni davranışına, API rotasına, `cookies()`/`headers()` çağrısına yer yok.
- Saat dilimi her yerde `Europe/Istanbul`. Tarihler `YYYY-MM-DD` düz metin.
- Sayı biçimi Türkçe: ondalık ayırıcı virgül (`2,5 milyon`).
- Arayüz metinleri Türkçe ve cümle düzeninde ("Oyna", "Nasıl oynanır") — başlık düzeni (Her Kelime Büyük) kullanılmaz.
- localStorage'a yalnızca `lib/game/storage.ts` dokunur. Başka hiçbir dosyada `localStorage` geçmez.
- `components/` altındaki hiçbir dosya puan hesaplamaz; `lib/game/scoring.ts` çağırır.
- Test dosyaları `tests/` altında, `*.test.ts`.
- Her task kendi testleriyle biter ve tek başına commit'lenir.

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `lib/game/types.ts` | Banka şeması tipleri — tek doğruluk kaynağı |
| `lib/game/scoring.ts` | Oran, puan, slider kademe dönüşümü. Saf |
| `lib/game/format.ts` | Türkçe sayı biçimleme. Saf |
| `lib/game/daily.ts` | Tarih → günün bulmacası, takvim doğrulama. Saf |
| `lib/game/storage.ts` | localStorage'ın tek kapısı + saf kayıt geçiş fonksiyonları |
| `lib/game/bank.ts` | JSON bankasını okur, id → soru dizini kurar |
| `data/bank/fermi.json` | Tahmin soruları — paralel oturumun ürünü, salt okunur |
| `data/bank/mcq.json` | Çoktan seçmeli sorular — aynı şekilde salt okunur |
| `data/bank/packs.json` | Paketler: slug, başlık, açıklama, renk, soru listesi |
| `data/bank/calendar.json` | tarih → 3 soru kimliği |
| `components/TahminSlider.tsx` | Logaritmik slider + senkron sayı girişi |
| `components/SikListesi.tsx` | Dört şık |
| `components/SonucKarti.tsx` | Cevap açılışı, sapma, peçete hesabı |
| `components/SoruEkrani.tsx` | Oyun orkestrasyonu — soru dizisini yürütür |
| `components/PaketKarti.tsx` | Tipografik kapak |
| `app/page.tsx` | Ana ekran |
| `app/gunluk/page.tsx` | Günlük bulmaca |
| `app/paket/[slug]/page.tsx` | Paket oyunu |
| `app/sonuc/page.tsx` | Sonuç dökümü + paylaşım |
| `app/arsiv/page.tsx` | Geçmiş günler |

---

### Task 1: Proje iskeleti ve test koşucusu

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `vitest.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `.gitignore` (ekleme)
- Test: `tests/kurulum.test.ts`

**Interfaces:**
- Consumes: yok
- Produces: `@/` alias'ı proje köküne çözülür. `npm test`, `npm run build` komutları çalışır.

- [ ] **Step 1: Bağımlılıkları kur**

```bash
npm init -y
npm i next@15 react react-dom
npm i -D typescript @types/react @types/node @types/react-dom tailwindcss@4 @tailwindcss/postcss vitest jsdom
```

- [ ] **Step 2: Yapılandırma dosyalarını yaz**

`package.json` içindeki `scripts` alanını şununla değiştir:

```json
{
  "dev": "next dev",
  "build": "next build",
  "test": "vitest run",
  "test:watch": "vitest",
  "bank:validate": "node scripts/validate-bank.mjs",
  "bank:calendar": "node scripts/build-calendar.mjs"
}
```

`next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'export',
	images: { unoptimized: true }
};
export default nextConfig;
```

`postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
	test: {
		environment: 'jsdom',
		include: ['tests/**/*.test.ts']
	},
	resolve: {
		alias: { '@': path.resolve(process.cwd()) }
	}
});
```

`.gitignore` dosyasının sonuna ekle:

```
.next/
out/
next-env.d.ts
```

- [ ] **Step 3: Failing test yaz**

`tests/kurulum.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { SLIDER_MAX } from '@/lib/game/scoring';

describe('kurulum', () => {
	it('@ alias proje kokune cozulur', () => {
		expect(SLIDER_MAX).toBe(60);
	});

	it('jsdom ortami localStorage saglar', () => {
		localStorage.setItem('x', '1');
		expect(localStorage.getItem('x')).toBe('1');
		localStorage.clear();
	});
});
```

- [ ] **Step 4: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "@/lib/game/scoring"`

- [ ] **Step 5: Asgari uygulama**

`lib/game/scoring.ts`:

```ts
export const SLIDER_MAX = 60;
```

`app/globals.css`:

```css
@import 'tailwindcss';

:root {
	--zemin: #0b0b0b;
	--yuzey: #1a1a18;
	--kenar: #2c2c2a;
	--metin: #f1efe8;
	--metin-ikincil: #b4b2a9;
	--metin-soluk: #888780;
}

body {
	background: var(--zemin);
	color: var(--metin);
}
```

`app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Kaç?',
	description: 'Tahmin et, ne kadar yaklaştığını gör.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="tr">
			<body className="min-h-screen antialiased">{children}</body>
		</html>
	);
}
```

`app/page.tsx`:

```tsx
export default function AnaSayfa() {
	return <main className="p-6">Kaç?</main>;
}
```

- [ ] **Step 6: Testi ve derlemeyi çalıştır**

Run: `npm test`
Expected: PASS — 2 test

Run: `npm run build`
Expected: başarılı, `out/index.html` oluşur

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs vitest.config.ts .gitignore app lib tests
git commit -m "chore: next.js iskeleti, tailwind ve vitest kurulumu"
```

---

### Task 2: Şema tipleri, puanlama ve sayı biçimleme

**Files:**
- Create: `lib/game/types.ts`, `lib/game/format.ts`
- Modify: `lib/game/scoring.ts`
- Test: `tests/scoring.test.ts`, `tests/format.test.ts`

**Interfaces:**
- Consumes: yok
- Produces:
  - `type Soru = FermiSoru | McqSoru`, `interface Paket`, `interface TakvimGunu`
  - `sliderDegerine(kademe: number): number`
  - `kademeye(deger: number): number`
  - `oran(tahmin: number, cevap: number): number`
  - `fermiPuan(tahmin: number, cevap: number): number`
  - `mcqPuan(secim: number, dogru: number): number`
  - `soruPuani(soru: Soru, cevap: number): number`
  - `toplamPuan(puanlar: number[]): number`
  - `oranMetni(r: number): string`
  - `sayiMetni(n: number): string`

- [ ] **Step 1: Tipleri yaz**

`lib/game/types.ts`:

```ts
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
```

- [ ] **Step 2: Failing testleri yaz**

`tests/scoring.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
	SLIDER_MAX,
	sliderDegerine,
	kademeye,
	oran,
	fermiPuan,
	mcqPuan,
	soruPuani,
	toplamPuan,
	oranMetni
} from '@/lib/game/scoring';
import type { FermiSoru, McqSoru } from '@/lib/game/types';

describe('slider donusumu', () => {
	it('kademe 0 degeri 1 verir', () => {
		expect(sliderDegerine(0)).toBe(1);
	});

	it('kademe 60 degeri 1 milyon verir', () => {
		expect(sliderDegerine(SLIDER_MAX)).toBeCloseTo(1_000_000, 0);
	});

	it('kademeye ve sliderDegerine birbirinin tersi', () => {
		expect(kademeye(sliderDegerine(43))).toBe(43);
	});

	it('kademeye 1 altini 0a kilitler', () => {
		expect(kademeye(0.5)).toBe(0);
		expect(kademeye(0)).toBe(0);
	});

	it('kademeye ust sinirda taspmaz', () => {
		expect(kademeye(1e12)).toBe(SLIDER_MAX);
	});
});

describe('oran', () => {
	it('yon fark etmez', () => {
		expect(oran(200, 100)).toBe(2);
		expect(oran(100, 200)).toBe(2);
	});

	it('sifir ve negatif tahmin sonsuz verir', () => {
		expect(oran(0, 100)).toBe(Infinity);
		expect(oran(-5, 100)).toBe(Infinity);
	});

	it('sonlu olmayan girdi sonsuz verir', () => {
		expect(oran(NaN, 100)).toBe(Infinity);
		expect(oran(Infinity, 100)).toBe(Infinity);
	});
});

describe('fermiPuan', () => {
	it('tam isabet 100 verir', () => {
		expect(fermiPuan(100, 100)).toBe(100);
	});

	it('bilinen oranlarda beklenen puanlari verir', () => {
		expect(fermiPuan(120, 100)).toBe(96);
		expect(fermiPuan(150, 100)).toBe(91);
		expect(fermiPuan(200, 100)).toBe(85);
		expect(fermiPuan(500, 100)).toBe(65);
		expect(fermiPuan(1000, 100)).toBe(50);
	});

	it('100 kat ve otesi 0 verir', () => {
		expect(fermiPuan(10_000, 100)).toBe(0);
		expect(fermiPuan(100_000, 100)).toBe(0);
	});

	it('gecersiz tahmin 0 verir', () => {
		expect(fermiPuan(0, 100)).toBe(0);
		expect(fermiPuan(-1, 100)).toBe(0);
	});
});

describe('mcqPuan', () => {
	it('dogru secim 100, yanlis 0', () => {
		expect(mcqPuan(2, 2)).toBe(100);
		expect(mcqPuan(1, 2)).toBe(0);
	});
});

describe('soruPuani', () => {
	const fermi: FermiSoru = {
		id: 'f1',
		mode: 'fermi',
		prompt: 'kac?',
		topics: [],
		difficulty: 1,
		source: 's',
		origin: 'original',
		verified_at: '2026-08',
		answer: 100,
		unit: 'adet',
		kaynak_soru: 'q1'
	};

	const mcq: McqSoru = {
		id: 'm1',
		mode: 'mcq',
		prompt: 'hangisi?',
		topics: [],
		difficulty: 1,
		source: 's',
		origin: 'wiki',
		verified_at: '2026-08',
		choices: ['a', 'b', 'c', 'd'],
		correct_index: 2,
		explanation: 'cunku',
		kaynak_id: 'k1',
		kaynak_baslik: 'Kaynak'
	};

	it('tipe gore dogru fonksiyona yonlenir', () => {
		expect(soruPuani(fermi, 200)).toBe(85);
		expect(soruPuani(mcq, 2)).toBe(100);
		expect(soruPuani(mcq, 0)).toBe(0);
	});
});

describe('toplamPuan', () => {
	it('puanlari toplar', () => {
		expect(toplamPuan([100, 85, 0])).toBe(185);
	});

	it('bos dizi 0 verir', () => {
		expect(toplamPuan([])).toBe(0);
	});
});

describe('oranMetni', () => {
	it('turkce ondalik ayirici kullanir', () => {
		expect(oranMetni(1.34)).toBe('1,34×');
		expect(oranMetni(42.5)).toBe('42,5×');
	});

	it('buyuk oranlari yuvarlar', () => {
		expect(oranMetni(1234.6)).toBe('1.235×');
	});

	it('sonsuz icin tire verir', () => {
		expect(oranMetni(Infinity)).toBe('—');
	});
});
```

`tests/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sayiMetni } from '@/lib/game/format';

describe('sayiMetni', () => {
	it('milyon esigini turkce yazar', () => {
		expect(sayiMetni(2_500_000)).toBe('2,5 milyon');
		expect(sayiMetni(75_000_000)).toBe('75 milyon');
	});

	it('bin ve milyar esiklerini yazar', () => {
		expect(sayiMetni(1_000)).toBe('1 bin');
		expect(sayiMetni(3_200_000_000)).toBe('3,2 milyar');
	});

	it('kucuk sayilari oldugu gibi verir', () => {
		expect(sayiMetni(130)).toBe('130');
		expect(sayiMetni(8.5)).toBe('8,5');
	});

	it('sonlu olmayan sayi icin tire verir', () => {
		expect(sayiMetni(Infinity)).toBe('—');
	});
});
```

- [ ] **Step 3: Testleri çalıştır, başarısız olduklarını doğrula**

Run: `npm test`
Expected: FAIL — `sliderDegerine is not a function`, `Failed to resolve import "@/lib/game/format"`

- [ ] **Step 4: Uygulamayı yaz**

`lib/game/scoring.ts` dosyasını tümüyle şununla değiştir:

```ts
import type { Soru } from './types';

export const SLIDER_MAX = 60;

export function sliderDegerine(kademe: number): number {
	return Math.pow(10, kademe / 10);
}

export function kademeye(deger: number): number {
	if (!Number.isFinite(deger) || deger <= 1) return 0;
	return Math.min(SLIDER_MAX, Math.max(0, Math.round(Math.log10(deger) * 10)));
}

export function oran(tahmin: number, cevap: number): number {
	if (!Number.isFinite(tahmin) || tahmin <= 0) return Infinity;
	if (!Number.isFinite(cevap) || cevap <= 0) return Infinity;
	return tahmin > cevap ? tahmin / cevap : cevap / tahmin;
}

export function fermiPuan(tahmin: number, cevap: number): number {
	const r = oran(tahmin, cevap);
	if (!Number.isFinite(r)) return 0;
	const ham = 1 - Math.log10(r) / 2;
	return Math.round(100 * Math.min(1, Math.max(0, ham)));
}

export function mcqPuan(secim: number, dogru: number): number {
	return secim === dogru ? 100 : 0;
}

export function soruPuani(soru: Soru, cevap: number): number {
	return soru.mode === 'fermi' ? fermiPuan(cevap, soru.answer) : mcqPuan(cevap, soru.correct_index);
}

export function toplamPuan(puanlar: number[]): number {
	return puanlar.reduce((toplam, p) => toplam + p, 0);
}

export function oranMetni(r: number): string {
	if (!Number.isFinite(r)) return '—';
	if (r < 10) return r.toFixed(2).replace('.', ',') + '×';
	if (r < 100) return r.toFixed(1).replace('.', ',') + '×';
	return Math.round(r).toLocaleString('tr-TR') + '×';
}
```

`lib/game/format.ts`:

```ts
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
```

- [ ] **Step 5: Testleri çalıştır, geçtiklerini doğrula**

Run: `npm test`
Expected: PASS — tüm scoring ve format testleri

- [ ] **Step 6: Commit**

```bash
git add lib/game/types.ts lib/game/scoring.ts lib/game/format.ts tests/scoring.test.ts tests/format.test.ts
git commit -m "feat: puanlama, slider donusumu ve turkce sayi bicimleme"
```

---

### Task 3: Günlük bulmaca çözümü ve takvim doğrulama

**Files:**
- Create: `lib/game/daily.ts`
- Test: `tests/daily.test.ts`

**Interfaces:**
- Consumes: `TakvimGunu` (Task 2)
- Produces:
  - `bugununTarihi(simdi?: Date): string` — `YYYY-MM-DD`, Europe/Istanbul
  - `gunuBul(takvim: TakvimGunu[], tarih: string): TakvimGunu | null`
  - `takvimHatalari(takvim: TakvimGunu[]): string[]` — boş dizi = geçerli
  - `oncekiGun(tarih: string): string`

- [ ] **Step 1: Failing testleri yaz**

`tests/daily.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { bugununTarihi, gunuBul, takvimHatalari, oncekiGun } from '@/lib/game/daily';
import type { TakvimGunu } from '@/lib/game/types';

const takvim: TakvimGunu[] = [
	{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'm1', 'm2'] },
	{ tarih: '2026-08-18', no: 2, soru_ids: ['f2', 'm3', 'm4'] }
];

describe('bugununTarihi', () => {
	it('istanbul saatine gore gun sinirini dogru ceker', () => {
		expect(bugununTarihi(new Date('2026-08-17T20:59:00Z'))).toBe('2026-08-17');
		expect(bugununTarihi(new Date('2026-08-17T21:01:00Z'))).toBe('2026-08-18');
	});

	it('YYYY-MM-DD bicimi verir', () => {
		expect(bugununTarihi(new Date('2026-01-05T12:00:00Z'))).toBe('2026-01-05');
	});
});

describe('gunuBul', () => {
	it('ayni tarih hep ayni bulmacayi verir', () => {
		expect(gunuBul(takvim, '2026-08-17')).toEqual(takvim[0]);
		expect(gunuBul(takvim, '2026-08-17')).toEqual(takvim[0]);
	});

	it('takvim disi tarih null verir', () => {
		expect(gunuBul(takvim, '2030-01-01')).toBeNull();
	});
});

describe('oncekiGun', () => {
	it('bir gun geri gider', () => {
		expect(oncekiGun('2026-08-18')).toBe('2026-08-17');
	});

	it('ay sinirini asar', () => {
		expect(oncekiGun('2026-09-01')).toBe('2026-08-31');
	});

	it('yil sinirini asar', () => {
		expect(oncekiGun('2027-01-01')).toBe('2026-12-31');
	});
});

describe('takvimHatalari', () => {
	it('gecerli takvimde bos dizi verir', () => {
		expect(takvimHatalari(takvim)).toEqual([]);
	});

	it('tekrar eden tarihi yakalar', () => {
		const bozuk: TakvimGunu[] = [...takvim, { tarih: '2026-08-17', no: 3, soru_ids: ['f3', 'm5', 'm6'] }];
		expect(takvimHatalari(bozuk)).toContain('tekrar eden tarih: 2026-08-17');
	});

	it('gun icinde tekrar eden soruyu yakalar', () => {
		const bozuk: TakvimGunu[] = [{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'f1', 'm2'] }];
		expect(takvimHatalari(bozuk)).toContain('2026-08-17 gununde ayni soru iki kez: f1');
	});

	it('gunler arasi tekrar eden soruyu yakalar', () => {
		const bozuk: TakvimGunu[] = [
			{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'm1', 'm2'] },
			{ tarih: '2026-08-18', no: 2, soru_ids: ['f1', 'm3', 'm4'] }
		];
		expect(takvimHatalari(bozuk)).toContain('soru birden fazla gunde: f1');
	});

	it('uc soru olmayan gunu yakalar', () => {
		const bozuk: TakvimGunu[] = [{ tarih: '2026-08-17', no: 1, soru_ids: ['f1', 'm1'] }];
		expect(takvimHatalari(bozuk)).toContain('2026-08-17 gununde 3 yerine 2 soru var');
	});
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını doğrula**

Run: `npm test tests/daily.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/daily"`

- [ ] **Step 3: Uygulamayı yaz**

`lib/game/daily.ts`:

```ts
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
```

- [ ] **Step 4: Testleri çalıştır, geçtiklerini doğrula**

Run: `npm test tests/daily.test.ts`
Expected: PASS — 11 test

- [ ] **Step 5: Commit**

```bash
git add lib/game/daily.ts tests/daily.test.ts
git commit -m "feat: gunluk bulmaca cozumu ve takvim dogrulama"
```

---

### Task 4: Kalıcılık ve streak

**Files:**
- Create: `lib/game/storage.ts`
- Test: `tests/storage.test.ts`

**Interfaces:**
- Consumes: `oncekiGun` (Task 3)
- Produces:
  - `interface OyunKaydi { streak: number; sonOynananGun: string | null; gunluk: Record<string, number>; paketler: Record<string, { enIyi: number; tamamlandi: string }> }`
  - `BOS_KAYIT: OyunKaydi`
  - `kaydiOku(): OyunKaydi`
  - `kaydiYaz(kayit: OyunKaydi): void`
  - `gunuKaydet(kayit: OyunKaydi, tarih: string, puan: number): OyunKaydi` — saf
  - `paketiKaydet(kayit: OyunKaydi, slug: string, puan: number, zaman: string): OyunKaydi` — saf

- [ ] **Step 1: Failing testleri yaz**

`tests/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
	BOS_KAYIT,
	kaydiOku,
	kaydiYaz,
	gunuKaydet,
	paketiKaydet,
	type OyunKaydi
} from '@/lib/game/storage';

beforeEach(() => localStorage.clear());

describe('gunuKaydet', () => {
	it('ilk oyunda streak 1 olur', () => {
		const k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		expect(k.streak).toBe(1);
		expect(k.sonOynananGun).toBe('2026-08-17');
		expect(k.gunluk['2026-08-17']).toBe(250);
	});

	it('ardisik gunde streak artar', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-18', 260);
		expect(k.streak).toBe(2);
	});

	it('atlanan gunde streak 1e doner', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-18', 260);
		k = gunuKaydet(k, '2026-08-20', 270);
		expect(k.streak).toBe(1);
	});

	it('ayni gunu ikinci kez oynamak streaki sismez', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-17', 100);
		expect(k.streak).toBe(1);
	});

	it('ayni gunde dusuk puan yuksegi ezmez', () => {
		let k = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		k = gunuKaydet(k, '2026-08-17', 100);
		expect(k.gunluk['2026-08-17']).toBe(250);
	});

	it('girdi kaydini degistirmez', () => {
		const once = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		gunuKaydet(once, '2026-08-18', 300);
		expect(once.streak).toBe(1);
		expect(once.sonOynananGun).toBe('2026-08-17');
	});
});

describe('paketiKaydet', () => {
	it('yeni paketi kaydeder', () => {
		const k = paketiKaydet(BOS_KAYIT, 'sayilarla-istanbul', 874, '2026-08-17T10:00:00Z');
		expect(k.paketler['sayilarla-istanbul'].enIyi).toBe(874);
	});

	it('dusuk skor en iyiyi ezmez', () => {
		let k = paketiKaydet(BOS_KAYIT, 'sayilarla-istanbul', 874, '2026-08-17T10:00:00Z');
		k = paketiKaydet(k, 'sayilarla-istanbul', 500, '2026-08-18T10:00:00Z');
		expect(k.paketler['sayilarla-istanbul'].enIyi).toBe(874);
	});

	it('yuksek skor en iyiyi gunceller', () => {
		let k = paketiKaydet(BOS_KAYIT, 'sayilarla-istanbul', 500, '2026-08-17T10:00:00Z');
		k = paketiKaydet(k, 'sayilarla-istanbul', 900, '2026-08-18T10:00:00Z');
		expect(k.paketler['sayilarla-istanbul'].enIyi).toBe(900);
		expect(k.paketler['sayilarla-istanbul'].tamamlandi).toBe('2026-08-18T10:00:00Z');
	});
});

describe('kaydiOku ve kaydiYaz', () => {
	it('yazilani geri okur', () => {
		const k: OyunKaydi = gunuKaydet(BOS_KAYIT, '2026-08-17', 250);
		kaydiYaz(k);
		expect(kaydiOku()).toEqual(k);
	});

	it('bos localStorage bos kayit verir', () => {
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('bozuk JSON bos kayit verir', () => {
		localStorage.setItem('kac:v1', '{bozuk');
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('eksik alanli kayit bos kayit verir', () => {
		localStorage.setItem('kac:v1', JSON.stringify({ streak: 3 }));
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});

	it('yanlis tipli streak bos kayit verir', () => {
		localStorage.setItem(
			'kac:v1',
			JSON.stringify({ streak: 'uc', sonOynananGun: null, gunluk: {}, paketler: {} })
		);
		expect(kaydiOku()).toEqual(BOS_KAYIT);
	});
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını doğrula**

Run: `npm test tests/storage.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/storage"`

- [ ] **Step 3: Uygulamayı yaz**

`lib/game/storage.ts`:

```ts
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
```

- [ ] **Step 4: Testleri çalıştır, geçtiklerini doğrula**

Run: `npm test tests/storage.test.ts`
Expected: PASS — 14 test

- [ ] **Step 5: Commit**

```bash
git add lib/game/storage.ts tests/storage.test.ts
git commit -m "feat: localStorage kaliciligi ve streak kurallari"
```

---

### Task 5: Banka yükleyicisi

> Bu task 2026-08-17'de yeniden yazıldı. Özgün hali "40 soruluk tohum set üret + doğrulama
> scripti + takvim scripti" diyordu. O iş paralel bir oturumda Python tarafında yapıldı:
> `data/bank/` altında 224 fermi, 204 mcq, 6 paket ve 100 günlük takvim hazır duruyor;
> `scripts/build_packs.py`, `build_calendar.py` ve `validate_bank.py` üretimi ve kalite
> kapısını üstlenmiş durumda. Geriye bu veriyi uygulamaya bağlayan yükleyici kaldı.
> `scripts/` altına `.mjs` eklenmiyor — orası Python tarafının.

**Files:**
- Create: `lib/game/bank.ts`
- Modify: `lib/game/types.ts` (`Paket` arayüzüne `aciklama` alanı)
- Test: `tests/bank.test.ts`

**Interfaces:**
- Consumes: `Soru`, `FermiSoru`, `McqSoru`, `Paket`, `TakvimGunu` (Task 2), `takvimHatalari` (Task 3)
- Produces:
  - `TUM_SORULAR: Soru[]`
  - `SORU_DIZINI: Map<string, Soru>`
  - `PAKETLER: Paket[]`
  - `TAKVIM: TakvimGunu[]`
  - `sorulariGetir(ids: string[]): Soru[]` — bulunamayan id'de hata fırlatır
  - `paketiGetir(slug: string): Paket | null`

**Testlerde sayı sabitlemek yasak.** Banka canlı: paralel oturum soru eklemeye devam ediyor
ve fermi sorularındaki İngilizce `_math_en` / `_napkin_en` alanlarını Türkçe `math` /
`napkin` alanlarına çevirip eskilerini silecek. `expect(TUM_SORULAR).toHaveLength(428)`
gibi bir iddia yarın kırılır ve kırıldığında kimseye bir şey öğretmez. Testler yapısal
olacak: banka boş değil, kimlikler tekil, her paketin her sorusu çözülebiliyor, takvim
geçerli. Aynı sebeple **paket başına sabit fermi/mcq oranı da varsayılmayacak** —
`mutfaktaki-fizik` paketi 9 fermi + 1 mcq, diğer beşi 3 + 7.

- [ ] **Step 0: Ölü script komutlarını kaldır**

Task 1, `package.json` içine `bank:validate` ve `bank:calendar` komutlarını yazmıştı; ikisi de
artık var olmayan `.mjs` dosyalarına işaret ediyor ve çalıştırılırsa hata veriyor. O iş Python
tarafına geçti. Her iki satırı da `scripts` bloğundan sil; `dev`, `build`, `test`, `test:watch`
kalsın.

- [ ] **Step 1: `Paket` tipine `aciklama` ekle**

`lib/game/types.ts` içindeki `Paket` arayüzünü şununla değiştir:

```ts
export interface Paket {
	slug: string;
	baslik: string;
	aciklama?: string;
	renk: string;
	metin_rengi: string;
	soru_ids: string[];
}
```

- [ ] **Step 2: Failing testi yaz**

`tests/bank.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
	TUM_SORULAR,
	SORU_DIZINI,
	PAKETLER,
	TAKVIM,
	sorulariGetir,
	paketiGetir
} from '@/lib/game/bank';
import { takvimHatalari } from '@/lib/game/daily';

describe('banka yuklenmesi', () => {
	it('soru bankasi bos degil', () => {
		expect(TUM_SORULAR.length).toBeGreaterThan(0);
	});

	it('hem fermi hem mcq sorusu tasir', () => {
		expect(TUM_SORULAR.some((s) => s.mode === 'fermi')).toBe(true);
		expect(TUM_SORULAR.some((s) => s.mode === 'mcq')).toBe(true);
	});

	it('kimlikler tekil', () => {
		const idler = new Set(TUM_SORULAR.map((s) => s.id));
		expect(idler.size).toBe(TUM_SORULAR.length);
	});

	it('dizin her soruyu id ile bulur', () => {
		for (const s of TUM_SORULAR) {
			expect(SORU_DIZINI.get(s.id)).toBe(s);
		}
	});
});

describe('paketler', () => {
	it('en az bir paket vardir', () => {
		expect(PAKETLER.length).toBeGreaterThan(0);
	});

	it('her paketin sorulari bankada cozulebilir', () => {
		for (const p of PAKETLER) {
			expect(sorulariGetir(p.soru_ids)).toHaveLength(p.soru_ids.length);
		}
	});

	it('paket slug lari tekil', () => {
		const slugler = new Set(PAKETLER.map((p) => p.slug));
		expect(slugler.size).toBe(PAKETLER.length);
	});

	it('her paketin kapak icin gerekli alanlari dolu', () => {
		for (const p of PAKETLER) {
			expect(p.baslik.length).toBeGreaterThan(0);
			expect(p.renk).toMatch(/^#[0-9a-fA-F]{6}$/);
			expect(p.metin_rengi).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});

	it('paketiGetir slug ile bulur, yoksa null verir', () => {
		expect(paketiGetir(PAKETLER[0].slug)).toBe(PAKETLER[0]);
		expect(paketiGetir('boyle-bir-paket-yok')).toBeNull();
	});
});

describe('takvim', () => {
	it('takvim gecerlidir', () => {
		expect(takvimHatalari(TAKVIM)).toEqual([]);
	});

	it('takvimdeki her soru bankada vardir', () => {
		for (const gun of TAKVIM) {
			expect(sorulariGetir(gun.soru_ids)).toHaveLength(3);
		}
	});

	it('gun numaralari tekil ve artan', () => {
		const numaralar = TAKVIM.map((g) => g.no);
		expect(new Set(numaralar).size).toBe(numaralar.length);
		expect([...numaralar].sort((a, b) => a - b)).toEqual(numaralar);
	});
});

describe('sorulariGetir', () => {
	it('sirayi korur', () => {
		const ids = TUM_SORULAR.slice(0, 3).map((s) => s.id);
		expect(sorulariGetir(ids).map((s) => s.id)).toEqual(ids);
	});

	it('bulunamayan id hata firlatir', () => {
		expect(() => sorulariGetir(['boyle-bir-soru-yok'])).toThrow(
			'bankada olmayan soru: boyle-bir-soru-yok'
		);
	});
});
```

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm test tests/bank.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/bank"`

- [ ] **Step 4: Banka modülünü yaz**

`lib/game/bank.ts`:

```ts
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
```

JSON dosyaları `resolveJsonModule` ile içe aktarılıyor; `tsconfig.json` bunu Task 1'de
açmıştı. Dosyalar `as` ile daraltılıyor çünkü TypeScript JSON'dan gelen dizgi alanlarını
geniş `string` olarak çıkarsıyor ve `mode: 'fermi' | 'mcq'` gibi birleşimlere kendiliğinden
oturmuyor.

- [ ] **Step 5: Testi çalıştır, geçtiğini doğrula**

Run: `npm test`
Expected: PASS — mevcut testler + bank testleri

- [ ] **Step 6: Commit**

```bash
git add lib/game/bank.ts lib/game/types.ts tests/bank.test.ts
git commit -m "feat: soru bankasi yukleyicisi"
```

**Bilinen ödünç — sonraki tur:** `bank.ts` bütün bankayı (şu an ~340 KB JSON) tek parçada
istemci paketine katıyor. Statik çıktıda çalışır ama ilk yükleme gereğinden ağır: oyuncu
tek paket oynarken 428 sorunun tamamını indiriyor. Paket başına ayrı JSON'a bölmek
Task 7'nin değil, ayrı bir performans turunun işi. Şimdilik bilinçli ödünç.

---

### Task 6: Oyun ekranı

**Files:**
- Create: `components/TahminSlider.tsx`, `components/SikListesi.tsx`, `components/SonucKarti.tsx`, `components/SoruEkrani.tsx`
- Test: `tests/oyun-akisi.test.ts`

**Interfaces:**
- Consumes: `Soru`, `soruPuani`, `oran`, `oranMetni`, `sayiMetni`, `sliderDegerine`, `kademeye`
- Produces:
  - `interface OyunSonucu { soruId: string; cevap: number; puan: number }`
  - `<SoruEkrani sorular={Soru[]} baslik={string} onBitti={(sonuclar: OyunSonucu[]) => void} />`
  - `sonrakiDurum(mevcut: number, toplam: number): 'devam' | 'bitti'` (`lib/game/akis.ts`)

- [ ] **Step 1: Failing testi yaz**

`tests/oyun-akisi.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { sonrakiDurum } from '@/lib/game/akis';

describe('sonrakiDurum', () => {
	it('son sorudan onceyse devam eder', () => {
		expect(sonrakiDurum(0, 3)).toBe('devam');
		expect(sonrakiDurum(1, 3)).toBe('devam');
	});

	it('son soruda biter', () => {
		expect(sonrakiDurum(2, 3)).toBe('bitti');
	});

	it('tek soruluk oyunda hemen biter', () => {
		expect(sonrakiDurum(0, 1)).toBe('bitti');
	});
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm test tests/oyun-akisi.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/akis"`

- [ ] **Step 3: Akış modülünü yaz**

`lib/game/akis.ts`:

```ts
export interface OyunSonucu {
	soruId: string;
	cevap: number;
	puan: number;
}

export function sonrakiDurum(mevcut: number, toplam: number): 'devam' | 'bitti' {
	return mevcut + 1 < toplam ? 'devam' : 'bitti';
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npm test tests/oyun-akisi.test.ts`
Expected: PASS — 3 test

- [ ] **Step 5: Slider bileşenini yaz**

`components/TahminSlider.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { SLIDER_MAX, sliderDegerine, kademeye } from '@/lib/game/scoring';
import { sayiMetni } from '@/lib/game/format';

interface Props {
	birim: string;
	deger: number;
	onDegisti: (deger: number) => void;
}

export function TahminSlider({ birim, deger, onDegisti }: Props) {
	const [yaziyor, setYaziyor] = useState(false);
	const [taslak, setTaslak] = useState('');

	function kademeDegisti(kademe: number) {
		onDegisti(Math.round(sliderDegerine(kademe)));
	}

	function yaziyiBitir() {
		const sayi = Number(taslak.replace(/\./g, '').replace(',', '.'));
		if (Number.isFinite(sayi) && sayi > 0) onDegisti(Math.round(sayi));
		setYaziyor(false);
	}

	return (
		<div>
			{yaziyor ? (
				<input
					autoFocus
					inputMode="numeric"
					value={taslak}
					onChange={(e) => setTaslak(e.target.value)}
					onBlur={yaziyiBitir}
					onKeyDown={(e) => e.key === 'Enter' && yaziyiBitir()}
					className="w-full bg-transparent text-4xl font-medium outline-none"
					aria-label="Tahmininizi yazın"
				/>
			) : (
				<button
					type="button"
					onClick={() => {
						setTaslak(String(deger));
						setYaziyor(true);
					}}
					className="text-left text-4xl font-medium"
				>
					{sayiMetni(deger)}
				</button>
			)}

			<p className="mt-1 text-sm text-[var(--metin-soluk)]">{birim}</p>

			<input
				type="range"
				min={0}
				max={SLIDER_MAX}
				step={1}
				value={kademeye(deger)}
				onChange={(e) => kademeDegisti(Number(e.target.value))}
				className="mt-6 w-full"
				aria-label="Tahmin ölçeği"
			/>

			<div className="mt-1 flex justify-between text-xs text-[var(--metin-soluk)]">
				<span>1</span>
				<span>bin</span>
				<span>milyon</span>
			</div>
		</div>
	);
}
```

- [ ] **Step 6: Şık listesini yaz**

`components/SikListesi.tsx`:

```tsx
'use client';

interface Props {
	siklar: readonly string[];
	secim: number | null;
	onSecti: (index: number) => void;
}

export function SikListesi({ siklar, secim, onSecti }: Props) {
	return (
		<div className="flex flex-col gap-2">
			{siklar.map((sik, i) => (
				<button
					key={sik}
					type="button"
					onClick={() => onSecti(i)}
					aria-pressed={secim === i}
					className={
						'rounded-lg border px-4 py-3 text-left text-base transition ' +
						(secim === i
							? 'border-[var(--metin)] bg-[var(--yuzey)]'
							: 'border-[var(--kenar)] hover:border-[var(--metin-soluk)]')
					}
				>
					{sik}
				</button>
			))}
		</div>
	);
}
```

- [ ] **Step 7: Sonuç kartını yaz**

`components/SonucKarti.tsx`:

```tsx
import type { Soru } from '@/lib/game/types';
import { oran, oranMetni } from '@/lib/game/scoring';
import { sayiMetni } from '@/lib/game/format';

interface Props {
	soru: Soru;
	cevap: number;
	puan: number;
}

export function SonucKarti({ soru, cevap, puan }: Props) {
	return (
		<div className="rounded-xl bg-[var(--yuzey)] p-4">
			<div className="flex items-baseline gap-3">
				<span className="text-3xl font-medium">{puan}</span>
				<span className="text-sm text-[var(--metin-ikincil)]">
					puan
					{soru.mode === 'fermi' && ` · ${oranMetni(oran(cevap, soru.answer))} sapma`}
				</span>
			</div>

			{soru.mode === 'fermi' ? (
				<>
					<p className="mt-3 text-sm text-[var(--metin-ikincil)]">
						Doğru cevap {sayiMetni(soru.answer)} {soru.unit} · senin tahminin {sayiMetni(cevap)}
					</p>
					{soru.napkin && (
						<div className="mt-4 rounded-lg border border-[var(--kenar)] p-3">
							<p className="text-sm font-medium">Peçete hesabı</p>
							<p className="mt-1 text-sm text-[var(--metin-ikincil)]">{soru.napkin.lead}</p>
							<dl className="mt-3">
								{soru.napkin.rows.map(([etiket, deger]) => (
									<div key={etiket} className="flex justify-between py-1 text-sm">
										<dt className="text-[var(--metin-ikincil)]">{etiket}</dt>
										<dd>{deger}</dd>
									</div>
								))}
							</dl>
						</div>
					)}
				</>
			) : (
				<>
					<p className="mt-3 text-sm text-[var(--metin-ikincil)]">
						Doğru cevap: {soru.choices[soru.correct_index]}
					</p>
					<p className="mt-2 text-sm text-[var(--metin-ikincil)]">{soru.explanation}</p>
				</>
			)}

			<p className="mt-4 text-xs text-[var(--metin-soluk)]">Kaynak: {soru.source}</p>
		</div>
	);
}
```

- [ ] **Step 8: Oyun orkestrasyonunu yaz**

`components/SoruEkrani.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { Soru } from '@/lib/game/types';
import { soruPuani } from '@/lib/game/scoring';
import { sonrakiDurum, type OyunSonucu } from '@/lib/game/akis';
import { TahminSlider } from './TahminSlider';
import { SikListesi } from './SikListesi';
import { SonucKarti } from './SonucKarti';

interface Props {
	sorular: Soru[];
	baslik: string;
	onBitti: (sonuclar: OyunSonucu[]) => void;
}

export function SoruEkrani({ sorular, baslik, onBitti }: Props) {
	const [sira, setSira] = useState(0);
	const [tahmin, setTahmin] = useState(1000);
	const [secim, setSecim] = useState<number | null>(null);
	const [kilitli, setKilitli] = useState(false);
	const [hata, setHata] = useState('');
	const [sonuclar, setSonuclar] = useState<OyunSonucu[]>([]);

	const soru = sorular[sira];
	const cevap = soru.mode === 'fermi' ? tahmin : (secim ?? -1);
	const puan = kilitli ? soruPuani(soru, cevap) : 0;

	function kilitle() {
		if (soru.mode === 'mcq' && secim === null) {
			setHata('Önce bir şık seç');
			return;
		}
		setHata('');
		setKilitli(true);
		setSonuclar([...sonuclar, { soruId: soru.id, cevap, puan: soruPuani(soru, cevap) }]);
	}

	function devam() {
		if (sonrakiDurum(sira, sorular.length) === 'bitti') {
			onBitti(sonuclar);
			return;
		}
		setSira(sira + 1);
		setTahmin(1000);
		setSecim(null);
		setKilitli(false);
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-xl flex-col p-5">
			<p className="text-xs text-[var(--metin-soluk)]">
				{baslik} · soru {sira + 1} / {sorular.length}
			</p>

			<h1 className="mt-2 text-xl font-medium leading-snug">{soru.prompt}</h1>

			<div className="mt-8 flex-1">
				{kilitli ? (
					<SonucKarti soru={soru} cevap={cevap} puan={puan} />
				) : soru.mode === 'fermi' ? (
					<TahminSlider birim={soru.unit} deger={tahmin} onDegisti={setTahmin} />
				) : (
					<SikListesi siklar={soru.choices} secim={secim} onSecti={setSecim} />
				)}
			</div>

			{hata && <p className="mt-3 text-sm text-red-400">{hata}</p>}

			<button
				type="button"
				onClick={kilitli ? devam : kilitle}
				className="mt-6 rounded-lg bg-[var(--metin)] px-6 py-3 font-medium text-[var(--zemin)]"
			>
				{kilitli ? (sonrakiDurum(sira, sorular.length) === 'bitti' ? 'Sonuçlar' : 'Devam') : 'Kilitle'}
			</button>
		</main>
	);
}
```

- [ ] **Step 9: Testleri ve derlemeyi çalıştır**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: başarılı

- [ ] **Step 10: Commit**

```bash
git add lib/game/akis.ts components tests/oyun-akisi.test.ts
git commit -m "feat: oyun ekrani - slider, siklar, cevap acilisi"
```

---

### Task 7: Ana ekran, günlük ve paket rotaları

**Files:**
- Create: `components/PaketKarti.tsx`, `components/GunlukKapak.tsx`, `app/gunluk/page.tsx`, `app/paket/[slug]/page.tsx`, `app/paket/[slug]/PaketOyunu.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `PAKETLER`, `TAKVIM`, `sorulariGetir`, `paketiGetir`, `bugununTarihi`, `gunuBul`, `kaydiOku`, `kaydiYaz`, `gunuKaydet`, `paketiKaydet`, `SoruEkrani`, `toplamPuan`
- Produces: `sonucuSakla(sonuc: SaklananSonuc): void` ve `sonucuAl(): SaklananSonuc | null` (`lib/game/sonuc-aktarim.ts`), `interface SaklananSonuc { baslik: string; kaynak: 'gunluk' | 'paket'; slug: string; soruIdler: string[]; cevaplar: number[]; puanlar: number[] }`

- [ ] **Step 1: Sonuç aktarım modülünü yaz**

Statik çıktıda sunucu yok; sonuç ekranına veri sessionStorage üzerinden taşınır.

`lib/game/sonuc-aktarim.ts`:

```ts
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
```

- [ ] **Step 2: Paket kartını yaz**

`components/PaketKarti.tsx`:

```tsx
import Link from 'next/link';
import type { Paket } from '@/lib/game/types';

interface Props {
	paket: Paket;
	enIyi: number | null;
}

export function PaketKarti({ paket, enIyi }: Props) {
	return (
		<Link href={`/paket/${paket.slug}`} className="block">
			<div
				className="flex h-40 flex-col justify-between rounded-xl p-4"
				style={{ background: paket.renk, color: paket.metin_rengi }}
			>
				<span className="text-xs opacity-70">{paket.soru_ids.length} soru</span>
				<span className="text-2xl font-medium leading-tight">{paket.baslik}</span>
			</div>
			<p className="mt-2 text-xs text-[var(--metin-soluk)]">
				{enIyi === null ? 'oynanmadı' : `en iyi ${enIyi} / 1000`}
			</p>
		</Link>
	);
}
```

- [ ] **Step 3: Günlük kapağı yaz**

`components/GunlukKapak.tsx`:

```tsx
import Link from 'next/link';

interface Props {
	no: number | null;
	tarihMetni: string;
	streak: number;
	oynandi: boolean;
}

export function GunlukKapak({ no, tarihMetni, streak, oynandi }: Props) {
	if (no === null) {
		return (
			<div className="rounded-xl bg-[var(--yuzey)] p-5">
				<p className="text-sm text-[var(--metin-ikincil)]">
					Bugün için bulmaca yok. Aşağıdaki paketlerden birini dene.
				</p>
			</div>
		);
	}

	return (
		<div className="flex items-end justify-between gap-4 rounded-xl bg-[var(--yuzey)] p-5">
			<div>
				<p className="text-xs tracking-wide text-[var(--metin-soluk)]">
					bugünün bulmacası · {tarihMetni}
				</p>
				<p className="mt-2 text-3xl font-medium">No. {no}</p>
				<p className="mt-1 text-sm text-[var(--metin-ikincil)]">
					3 soru{streak > 0 && ` · seri ${streak} gün`}
				</p>
			</div>
			<Link
				href="/gunluk"
				className="whitespace-nowrap rounded-lg bg-[var(--metin)] px-5 py-2.5 font-medium text-[var(--zemin)]"
			>
				{oynandi ? 'Tekrar oyna' : 'Oyna'}
			</Link>
		</div>
	);
}
```

- [ ] **Step 4: Ana ekranı yaz**

`app/page.tsx` dosyasını tümüyle şununla değiştir:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { PAKETLER, TAKVIM } from '@/lib/game/bank';
import { bugununTarihi, gunuBul } from '@/lib/game/daily';
import { kaydiOku, BOS_KAYIT, type OyunKaydi } from '@/lib/game/storage';
import { PaketKarti } from '@/components/PaketKarti';
import { GunlukKapak } from '@/components/GunlukKapak';

export default function AnaSayfa() {
	const [kayit, setKayit] = useState<OyunKaydi>(BOS_KAYIT);
	const [tarih, setTarih] = useState('');

	useEffect(() => {
		setKayit(kaydiOku());
		setTarih(bugununTarihi());
	}, []);

	const gun = tarih ? gunuBul(TAKVIM, tarih) : null;
	const tarihMetni = tarih
		? new Date(tarih + 'T00:00:00Z').toLocaleDateString('tr-TR', {
				day: 'numeric',
				month: 'long',
				timeZone: 'UTC'
			})
		: '';

	return (
		<main className="mx-auto max-w-3xl p-5">
			<header className="mb-6 flex items-center justify-between">
				<span className="text-lg font-medium">Kaç?</span>
				{kayit.streak > 0 && (
					<span className="rounded-full bg-[#fac775] px-3 py-1 text-xs text-[#0b0b0b]">
						seri {kayit.streak}
					</span>
				)}
			</header>

			<GunlukKapak
				no={gun?.no ?? null}
				tarihMetni={tarihMetni}
				streak={kayit.streak}
				oynandi={tarih in kayit.gunluk}
			/>

			<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{PAKETLER.map((p) => (
					<PaketKarti key={p.slug} paket={p} enIyi={kayit.paketler[p.slug]?.enIyi ?? null} />
				))}
			</div>

			<nav className="mt-8 text-sm text-[var(--metin-soluk)]">
				<a href="/arsiv">Arşiv</a>
			</nav>
		</main>
	);
}
```

- [ ] **Step 5: Günlük rotayı yaz**

`app/gunluk/page.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TAKVIM, sorulariGetir } from '@/lib/game/bank';
import { bugununTarihi, gunuBul } from '@/lib/game/daily';
import { toplamPuan } from '@/lib/game/scoring';
import { kaydiOku, kaydiYaz, gunuKaydet } from '@/lib/game/storage';
import { sonucuSakla } from '@/lib/game/sonuc-aktarim';
import { SoruEkrani } from '@/components/SoruEkrani';
import type { Soru } from '@/lib/game/types';
import type { OyunSonucu } from '@/lib/game/akis';

export default function GunlukSayfa() {
	const router = useRouter();
	const [sorular, setSorular] = useState<Soru[] | null>(null);
	const [tarih, setTarih] = useState('');
	const [no, setNo] = useState(0);

	useEffect(() => {
		const t = bugununTarihi();
		const gun = gunuBul(TAKVIM, t);
		setTarih(t);
		setNo(gun?.no ?? 0);
		setSorular(gun ? sorulariGetir(gun.soru_ids) : []);
	}, []);

	if (sorular === null) return <main className="p-5">Yükleniyor…</main>;

	if (sorular.length === 0) {
		return (
			<main className="mx-auto max-w-xl p-5">
				<p>Bugün için bulmaca yok.</p>
				<a href="/" className="mt-4 inline-block underline">
					Ana ekrana dön
				</a>
			</main>
		);
	}

	function bitti(sonuclar: OyunSonucu[]) {
		const puanlar = sonuclar.map((s) => s.puan);
		kaydiYaz(gunuKaydet(kaydiOku(), tarih, toplamPuan(puanlar)));
		sonucuSakla({
			baslik: `Kaç? · No. ${no}`,
			kaynak: 'gunluk',
			slug: tarih,
			soruIdler: sonuclar.map((s) => s.soruId),
			cevaplar: sonuclar.map((s) => s.cevap),
			puanlar
		});
		router.push('/sonuc');
	}

	return <SoruEkrani sorular={sorular} baslik={`No. ${no}`} onBitti={bitti} />;
}
```

- [ ] **Step 6: Paket rotasını yaz**

`app/paket/[slug]/page.tsx` — statik dışa aktarım için `generateStaticParams` şart:

```tsx
import { PAKETLER } from '@/lib/game/bank';
import { PaketOyunu } from './PaketOyunu';

export function generateStaticParams() {
	return PAKETLER.map((p) => ({ slug: p.slug }));
}

export default async function PaketSayfa({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	return <PaketOyunu slug={slug} />;
}
```

`app/paket/[slug]/PaketOyunu.tsx`:

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { paketiGetir, sorulariGetir } from '@/lib/game/bank';
import { toplamPuan } from '@/lib/game/scoring';
import { kaydiOku, kaydiYaz, paketiKaydet } from '@/lib/game/storage';
import { sonucuSakla } from '@/lib/game/sonuc-aktarim';
import { SoruEkrani } from '@/components/SoruEkrani';
import type { OyunSonucu } from '@/lib/game/akis';

export function PaketOyunu({ slug }: { slug: string }) {
	const router = useRouter();
	const paket = paketiGetir(slug);

	if (!paket) {
		return (
			<main className="mx-auto max-w-xl p-5">
				<p>Bu paket bulunamadı.</p>
				<a href="/" className="mt-4 inline-block underline">
					Ana ekrana dön
				</a>
			</main>
		);
	}

	const sorular = sorulariGetir(paket.soru_ids);

	function bitti(sonuclar: OyunSonucu[]) {
		const puanlar = sonuclar.map((s) => s.puan);
		kaydiYaz(
			paketiKaydet(kaydiOku(), slug, toplamPuan(puanlar), new Date().toISOString())
		);
		sonucuSakla({
			baslik: `Kaç? · ${paket!.baslik}`,
			kaynak: 'paket',
			slug,
			soruIdler: sonuclar.map((s) => s.soruId),
			cevaplar: sonuclar.map((s) => s.cevap),
			puanlar
		});
		router.push('/sonuc');
	}

	return <SoruEkrani sorular={sorular} baslik={paket.baslik} onBitti={bitti} />;
}
```

- [ ] **Step 7: Testleri ve derlemeyi çalıştır**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: başarılı; `out/paket/sayilarla-istanbul/index.html` dahil dört paket sayfası üretilir

- [ ] **Step 8: Elle kontrol**

Run: `npm run dev`
Ana ekranda günlük kapak ve dört kart görünmeli; bir pakete girip 10 soruyu tamamlayınca `/sonuc` rotasına gitmeli (henüz boş sayfa).

- [ ] **Step 9: Commit**

```bash
git add lib/game/sonuc-aktarim.ts components/PaketKarti.tsx components/GunlukKapak.tsx app
git commit -m "feat: ana ekran, gunluk ve paket rotalari"
```

---

### Task 8: Sonuç ekranı, paylaşım ve arşiv

**Files:**
- Create: `lib/game/paylasim.ts`, `app/sonuc/page.tsx`, `app/arsiv/page.tsx`
- Test: `tests/paylasim.test.ts`

**Interfaces:**
- Consumes: `SaklananSonuc`, `sonucuAl`, `SORU_DIZINI`, `oran`, `oranMetni`, `toplamPuan`, `TAKVIM`, `kaydiOku`
- Produces: `paylasimMetni(sonuc: SaklananSonuc, sorular: Soru[]): string`

- [ ] **Step 1: Failing testi yaz**

`tests/paylasim.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { paylasimMetni } from '@/lib/game/paylasim';
import type { FermiSoru, McqSoru } from '@/lib/game/types';
import type { SaklananSonuc } from '@/lib/game/sonuc-aktarim';

const fermi: FermiSoru = {
	id: 'f1',
	mode: 'fermi',
	prompt: 'kac?',
	topics: [],
	difficulty: 1,
	source: 's',
	origin: 'original',
	verified_at: '2026-08',
	answer: 100,
	unit: 'adet',
	kaynak_soru: 'q1'
};

const mcq: McqSoru = {
	id: 'm1',
	mode: 'mcq',
	prompt: 'hangisi?',
	topics: [],
	difficulty: 1,
	source: 's',
	origin: 'wiki',
	verified_at: '2026-08',
	choices: ['a', 'b', 'c', 'd'],
	correct_index: 2,
	explanation: 'cunku',
	kaynak_id: 'k1',
	kaynak_baslik: 'Kaynak'
};

const sonuc: SaklananSonuc = {
	baslik: 'Kaç? · No. 23',
	kaynak: 'gunluk',
	slug: '2026-08-17',
	soruIdler: ['f1', 'm1'],
	cevaplar: [200, 2],
	puanlar: [85, 100]
};

describe('paylasimMetni', () => {
	const metin = paylasimMetni(sonuc, [fermi, mcq]);

	it('baslikla baslar', () => {
		expect(metin.split('\n')[0]).toBe('Kaç? · No. 23');
	});

	it('fermi sorusunu sapmayla yazar', () => {
		expect(metin).toContain('01  2,00×');
	});

	it('mcq sorusunu isaretle yazar', () => {
		expect(metin).toContain('02  ✓');
	});

	it('toplam puani yazar', () => {
		expect(metin).toContain('185 puan');
	});

	it('yanlis mcq icin capraz isaret koyar', () => {
		const yanlis = { ...sonuc, cevaplar: [200, 0], puanlar: [85, 0] };
		expect(paylasimMetni(yanlis, [fermi, mcq])).toContain('02  ✗');
	});
});
```

- [ ] **Step 2: Testi çalıştır, başarısız olduğunu doğrula**

Run: `npm test tests/paylasim.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/paylasim"`

- [ ] **Step 3: Paylaşım modülünü yaz**

`lib/game/paylasim.ts`:

```ts
import type { Soru } from './types';
import type { SaklananSonuc } from './sonuc-aktarim';
import { oran, oranMetni, toplamPuan } from './scoring';

export function paylasimMetni(sonuc: SaklananSonuc, sorular: Soru[]): string {
	const satirlar = sorular.map((soru, i) => {
		const sira = String(i + 1).padStart(2, '0');
		if (soru.mode === 'fermi') {
			return `${sira}  ${oranMetni(oran(sonuc.cevaplar[i], soru.answer))}`;
		}
		return `${sira}  ${sonuc.puanlar[i] > 0 ? '✓' : '✗'}`;
	});

	return [
		sonuc.baslik,
		...satirlar,
		'─────────',
		`${toplamPuan(sonuc.puanlar)} puan`,
		'kac.gg'
	].join('\n');
}
```

- [ ] **Step 4: Testi çalıştır, geçtiğini doğrula**

Run: `npm test tests/paylasim.test.ts`
Expected: PASS — 5 test

- [ ] **Step 5: Sonuç ekranını yaz**

`app/sonuc/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { SORU_DIZINI } from '@/lib/game/bank';
import { toplamPuan } from '@/lib/game/scoring';
import { paylasimMetni } from '@/lib/game/paylasim';
import { sonucuAl, type SaklananSonuc } from '@/lib/game/sonuc-aktarim';
import { SonucKarti } from '@/components/SonucKarti';
import type { Soru } from '@/lib/game/types';

export default function SonucSayfa() {
	const [sonuc, setSonuc] = useState<SaklananSonuc | null>(null);
	const [kopyalandi, setKopyalandi] = useState(false);

	useEffect(() => setSonuc(sonucuAl()), []);

	if (!sonuc) {
		return (
			<main className="mx-auto max-w-xl p-5">
				<p>Gösterilecek sonuç yok.</p>
				<a href="/" className="mt-4 inline-block underline">
					Ana ekrana dön
				</a>
			</main>
		);
	}

	const sorular = sonuc.soruIdler
		.map((id) => SORU_DIZINI.get(id))
		.filter((s): s is Soru => s !== undefined);

	async function kopyala() {
		await navigator.clipboard.writeText(paylasimMetni(sonuc!, sorular));
		setKopyalandi(true);
	}

	return (
		<main className="mx-auto max-w-xl p-5">
			<p className="text-xs text-[var(--metin-soluk)]">{sonuc.baslik}</p>
			<h1 className="mt-2 text-4xl font-medium">
				{toplamPuan(sonuc.puanlar)}
				<span className="text-lg text-[var(--metin-ikincil)]"> / {sorular.length * 100}</span>
			</h1>

			<div className="mt-6 flex flex-col gap-3">
				{sorular.map((soru, i) => (
					<div key={soru.id}>
						<p className="mb-2 text-sm text-[var(--metin-ikincil)]">{soru.prompt}</p>
						<SonucKarti soru={soru} cevap={sonuc.cevaplar[i]} puan={sonuc.puanlar[i]} />
					</div>
				))}
			</div>

			<button
				type="button"
				onClick={kopyala}
				className="mt-6 rounded-lg bg-[var(--metin)] px-6 py-3 font-medium text-[var(--zemin)]"
			>
				{kopyalandi ? 'Kopyalandı' : 'Sonucu kopyala'}
			</button>

			<nav className="mt-6 text-sm text-[var(--metin-soluk)]">
				<a href="/">Ana ekran</a>
			</nav>
		</main>
	);
}
```

- [ ] **Step 6: Arşiv ekranını yaz**

`app/arsiv/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { TAKVIM } from '@/lib/game/bank';
import { bugununTarihi } from '@/lib/game/daily';
import { kaydiOku, BOS_KAYIT, type OyunKaydi } from '@/lib/game/storage';

export default function ArsivSayfa() {
	const [kayit, setKayit] = useState<OyunKaydi>(BOS_KAYIT);
	const [bugun, setBugun] = useState('');

	useEffect(() => {
		setKayit(kaydiOku());
		setBugun(bugununTarihi());
	}, []);

	const gecmis = TAKVIM.filter((g) => bugun && g.tarih <= bugun).reverse();

	return (
		<main className="mx-auto max-w-xl p-5">
			<h1 className="text-lg font-medium">Arşiv</h1>

			{gecmis.length === 0 ? (
				<p className="mt-4 text-sm text-[var(--metin-ikincil)]">Henüz geçmiş bulmaca yok.</p>
			) : (
				<ul className="mt-4 flex flex-col">
					{gecmis.map((gun) => (
						<li
							key={gun.tarih}
							className="flex items-center justify-between border-b border-[var(--kenar)] py-3"
						>
							<span>No. {gun.no}</span>
							<span className="text-sm text-[var(--metin-ikincil)]">
								{gun.tarih in kayit.gunluk ? `${kayit.gunluk[gun.tarih]} / 300` : 'oynanmadı'}
							</span>
						</li>
					))}
				</ul>
			)}

			<nav className="mt-6 text-sm text-[var(--metin-soluk)]">
				<a href="/">Ana ekran</a>
			</nav>
		</main>
	);
}
```

- [ ] **Step 7: Tam geçiş**

Run: `npm test`
Expected: PASS — bütün test dosyaları

Run: `npm run build`
Expected: başarılı

- [ ] **Step 8: Uçtan uca elle kontrol**

Run: `npm run dev`

Sırayla doğrula: ana ekran → günlük bulmaca → 3 soruyu cevapla → sonuç ekranı → "Sonucu kopyala" panoya `Kaç? · No. 1` ile başlayan metni koyar → ana ekranda seri rozeti belirir → arşivde bugünün skoru görünür → bir paketi bitirince kartın altında "en iyi N / 1000" yazar.

- [ ] **Step 9: Commit**

```bash
git add lib/game/paylasim.ts app/sonuc app/arsiv tests/paylasim.test.ts
git commit -m "feat: sonuc ekrani, panoya paylasim ve arsiv"
```

---

## Kapsam dışı (bu plan bunları yapmaz)

Hesap ve oturum, cihazlar arası senkron, sıralama tablosu, gerçek oyuncu dağılımı histogramı, bildirim, paket filtre çipleri, 1000 soruluk bankanın üretimi.
