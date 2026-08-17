# Mat Arayüz Revizyonu Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Arayüzü Posh referansına yaklaştırmak, tonu matlaştırmak ve sonuç ekranındaki 20 soruluk hesap boşluğunu kapatmak.

**Architecture:** Renk ve içerik seçimi kuralları `lib/game/` altında saf, test edilebilir fonksiyonlara taşınır; bileşenler yalnızca sonucu çizer. Paket renkleri `data/bank/packs.json` değiştirilmeden kodda türetilir.

**Tech Stack:** Next.js 15 (App Router, statik export), TypeScript, Tailwind v4, Vitest.

**Spec:** [2026-08-17-mat-arayuz-design.md](../specs/2026-08-17-mat-arayuz-design.md)

## Global Constraints

- **`data/` salt okunur.** Paket renkleri dahil hiçbir veri dosyası değiştirilmez — `data/bank/*` paralel bir oturumun alanı.
- `lib/game/` modülleri saf: DOM yok, React yok, `localStorage` yok.
- Bileşenler kural sahibi değil: renk türetme ve hesap seçimi `lib/game/` içinden çağrılır.
- Statik export korunur: `output: 'export'`, sunucu API'si yok.
- Türkçe arayüz metni, cümle düzeni ("Oyna", "Tümü", "Oynanmadı").
- TypeScript `strict`. Testler `tests/` altında, `*.test.ts`.
- Mevcut 115 testin hiçbiri gevşetilmez.

---

## Dosya Yapısı

| Dosya | Sorumluluk |
|---|---|
| `lib/game/renk.ts` | Hex dönüşümü, doygunluk düşürme, karıştırma, paket renk türetme. Saf |
| `lib/game/hesap.ts` | Bir soru için hangi hesabın gösterileceğini seçer. Saf |
| `app/globals.css` | Sayfa değişkenleri — yüzey ve kenar kısılır |
| `components/PaketKarti.tsx` | Portre kart, monogram rozeti, soru sayısı pill'i |
| `components/GunlukKapak.tsx` | Mat günlük blok, pill düğme |
| `app/page.tsx` | Üst çubuk filtre pill'leri, ızgara |
| `components/SonucKarti.tsx` | Hesap bloğunu `hesabiSec` sonucundan çizer |

---

### Task 1: Renk ve hesap seçimi modülleri

**Files:**
- Create: `lib/game/renk.ts`, `lib/game/hesap.ts`
- Test: `tests/renk.test.ts`, `tests/hesap.test.ts`

**Interfaces:**
- Consumes: `Paket`, `Soru` (`lib/game/types.ts`)
- Produces:
  - `doygunluguDusur(hex: string, k: number): string`
  - `karistir(a: string, b: string, t: number): string`
  - `paketRenkleri(paket: Paket): { zemin: string; metin: string }`
  - `interface Hesap { baslik: string; lead?: string; rows: [string, string][] }`
  - `hesabiSec(soru: Soru): Hesap | null`

- [ ] **Step 1: Failing testleri yaz**

`tests/renk.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { doygunluguDusur, karistir, paketRenkleri } from '@/lib/game/renk';
import type { Paket } from '@/lib/game/types';

describe('doygunluguDusur', () => {
	it('k=0 rengi degistirmez', () => {
		expect(doygunluguDusur('#26215C', 0)).toBe('#26215c');
	});

	it('k=1 rengi tamamen griye cevirir', () => {
		const gri = doygunluguDusur('#26215C', 1);
		expect(gri.slice(1, 3)).toBe(gri.slice(3, 5));
		expect(gri.slice(3, 5)).toBe(gri.slice(5, 7));
	});

	it('bilinen paket renklerini beklenen mat karsiliklarina cevirir', () => {
		expect(doygunluguDusur('#3A1F1B', 0.3)).toBe('#34211e');
		expect(doygunluguDusur('#10322E', 0.3)).toBe('#172f2c');
		expect(doygunluguDusur('#2E2416', 0.3)).toBe('#2b241b');
		expect(doygunluguDusur('#331A2B', 0.3)).toBe('#2e1d29');
		expect(doygunluguDusur('#26215C', 0.3)).toBe('#27234d');
		expect(doygunluguDusur('#1B2A3A', 0.3)).toBe('#1f2934');
	});

	it('gri bir rengi degistirmez', () => {
		expect(doygunluguDusur('#808080', 0.5)).toBe('#808080');
	});
});

describe('karistir', () => {
	it('t=0 ilk rengi verir', () => {
		expect(karistir('#FFFFFF', '#000000', 0)).toBe('#ffffff');
	});

	it('t=1 ikinci rengi verir', () => {
		expect(karistir('#FFFFFF', '#000000', 1)).toBe('#000000');
	});

	it('t=0.5 ortayi verir', () => {
		expect(karistir('#FFFFFF', '#000000', 0.5)).toBe('#808080');
	});
});

describe('paketRenkleri', () => {
	const paket = (renk: string, metin: string): Paket => ({
		slug: 's',
		baslik: 'B',
		renk,
		metin_rengi: metin,
		soru_ids: []
	});

	it('bilinen paketler icin beklenen zemin ve metni verir', () => {
		expect(paketRenkleri(paket('#26215C', '#EEEDFE'))).toEqual({
			zemin: '#27234d',
			metin: '#b6b4cc'
		});
		expect(paketRenkleri(paket('#10322E', '#E3F5EE'))).toEqual({
			zemin: '#172f2c',
			metin: '#aabeb8'
		});
		expect(paketRenkleri(paket('#1B2A3A', '#E4F0FA'))).toEqual({
			zemin: '#1f2934',
			metin: '#adb8c3'
		});
	});
});
```

`tests/hesap.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { hesabiSec } from '@/lib/game/hesap';
import type { FermiSoru, McqSoru } from '@/lib/game/types';

const temelFermi: FermiSoru = {
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
	kaynak_baslik: 'K'
};

describe('hesabiSec', () => {
	it('napkin varsa onu secer ve lead tasir', () => {
		const soru: FermiSoru = {
			...temelFermi,
			napkin: { lead: 'kurarak git', rows: [['a', '1']] },
			math: [['b', '2']]
		};
		expect(hesabiSec(soru)).toEqual({
			baslik: 'Peçete hesabı',
			lead: 'kurarak git',
			rows: [['a', '1']]
		});
	});

	it('napkin yoksa math secilir ve lead tasimaz', () => {
		const soru: FermiSoru = { ...temelFermi, math: [['b', '2']] };
		expect(hesabiSec(soru)).toEqual({
			baslik: 'Nasıl hesaplanıyor',
			rows: [['b', '2']]
		});
	});

	it('ikisi de yoksa null verir', () => {
		expect(hesabiSec(temelFermi)).toBeNull();
	});

	it('bos rows tasiyan napkin secilmez, math yedege duser', () => {
		const soru: FermiSoru = {
			...temelFermi,
			napkin: { lead: 'x', rows: [] },
			math: [['b', '2']]
		};
		expect(hesabiSec(soru)?.baslik).toBe('Nasıl hesaplanıyor');
	});

	it('mcq sorusu icin null verir', () => {
		expect(hesabiSec(mcq)).toBeNull();
	});
});
```

- [ ] **Step 2: Testleri çalıştır, başarısız olduklarını doğrula**

Run: `npm test tests/renk.test.ts tests/hesap.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/game/renk"` ve `"@/lib/game/hesap"`

- [ ] **Step 3: `lib/game/renk.ts` yaz**

```ts
import type { Paket } from './types';

// Paket renkleri data/bank/packs.json icinde ve orasi soru bankasi hattinin
// alani. Mat palet veriye dokunmadan burada turetiliyor; yeni paket eklendiginde
// kendiliginden uyar.
const DOYGUNLUK_DUSUSU = 0.3;
const METIN_KARISIMI = 0.28;

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace('#', '');
	return [
		parseInt(h.slice(0, 2), 16),
		parseInt(h.slice(2, 4), 16),
		parseInt(h.slice(4, 6), 16)
	];
}

function rgbToHex(r: number, g: number, b: number): string {
	const bilesen = (v: number) =>
		Math.round(Math.max(0, Math.min(255, v)))
			.toString(16)
			.padStart(2, '0');
	return '#' + bilesen(r) + bilesen(g) + bilesen(b);
}

export function doygunluguDusur(hex: string, k: number): string {
	const [r, g, b] = hexToRgb(hex);
	const gri = 0.299 * r + 0.587 * g + 0.114 * b;
	return rgbToHex(r + (gri - r) * k, g + (gri - g) * k, b + (gri - b) * k);
}

export function karistir(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function paketRenkleri(paket: Paket): { zemin: string; metin: string } {
	const zemin = doygunluguDusur(paket.renk, DOYGUNLUK_DUSUSU);
	// Mat his kontrastin dusmesinden geliyor: metin griye degil, zemine dogru kisiliyor.
	return { zemin, metin: karistir(paket.metin_rengi, zemin, METIN_KARISIMI) };
}
```

- [ ] **Step 4: `lib/game/hesap.ts` yaz**

```ts
import type { Soru } from './types';

export interface Hesap {
	baslik: string;
	lead?: string;
	rows: [string, string][];
}

// napkin oyuncunun sifirdan nasil akil yurutecegini anlatir - asil ogretici icerik odur.
// math gercek cevabin nasil turetildigini anlatir. Ikisi birden gosterilmez: yan yana
// konunca sonuc ekrani iki rakip hesapla kalabaliklasiyor.
export function hesabiSec(soru: Soru): Hesap | null {
	if (soru.mode !== 'fermi') return null;

	if (soru.napkin && soru.napkin.rows.length > 0) {
		return { baslik: 'Peçete hesabı', lead: soru.napkin.lead, rows: soru.napkin.rows };
	}

	if (soru.math && soru.math.length > 0) {
		return { baslik: 'Nasıl hesaplanıyor', rows: soru.math };
	}

	return null;
}
```

- [ ] **Step 5: Testleri çalıştır, geçtiklerini doğrula**

Run: `npm test`
Expected: PASS — mevcut 115 test + yeni testler

- [ ] **Step 6: Gerçek bankaya karşı doğrula**

```bash
node -e "
const f = require('./data/bank/fermi.json');
const napkin = f.filter(x => x.napkin && x.napkin.rows.length).length;
const sadeceMath = f.filter(x => !(x.napkin && x.napkin.rows.length) && x.math && x.math.length).length;
const hicbiri = f.filter(x => !(x.napkin && x.napkin.rows.length) && !(x.math && x.math.length)).length;
console.log('napkin:', napkin, '| sadece math:', sadeceMath, '| hicbiri:', hicbiri, '| toplam:', f.length);
"
```

Expected: `napkin: 224 | sadece math: 0 | hicbiri: 0 | toplam: 224`

Yani `math` yedeği bugün **hiçbir soruda devreye girmiyor**. Plan yazılırken 20 soruda `napkin` eksikti; banka hattı o boşluğu veri tarafında kapattı (commit `80dd66a`). Yedek yine de kodda kalıyor — banka büyüdükçe `napkin`'i eksik bir soru girebilir ve o zaman boş bölüm yerine hesabı göstermek doğru davranış. `hesabiSec` testleri bu yolu doğrudan sınıyor, gerçek veriye bağlı değil.

Sayılar tutmuyorsa dur ve bildir — banka yine değişmiş demektir, testleri gevşetme.

- [ ] **Step 7: Commit**

```bash
git add lib/game/renk.ts lib/game/hesap.ts tests/renk.test.ts tests/hesap.test.ts
git commit -m "feat: mat renk turetme ve hesap secimi modulleri"
```

---

### Task 2: Sayfa değişkenleri ve portre kart

**Files:**
- Modify: `app/globals.css`, `components/PaketKarti.tsx`

**Interfaces:**
- Consumes: `paketRenkleri` (Task 1)
- Produces: görsel değişiklik, yeni dışa aktarım yok

**Spec'ten sapma — oku:** Spec kart rozeti için `lib/game/ikon.ts` içinde bir ikon eşlemesi öngörüyordu. Bunun yerine **monogram** kullanılıyor: paket başlığının ilk harfi. Gerekçe — ikon seti ya yeni bir bağımlılık (statik bir uygulamaya `lucide-react` eklemek) ya da elle altı SVG yolu yazmak demek; monogram ikisini de gerektirmiyor, referanstaki dairesel rozetlerin bir kısmı zaten harf taşıyor ve yeni paket eklendiğinde kendiliğinden çalışıyor. `ikon.ts` oluşturulmuyor.

- [ ] **Step 1: Sayfa değişkenlerini kıs**

`app/globals.css` içindeki `:root` bloğunda yalnızca iki satırı değiştir:

```css
	--yuzey: #141414;
	--kenar: #232323;
```

Diğer değişkenlere (`--zemin`, `--metin`, `--metin-ikincil`, `--metin-soluk`) dokunma.

- [ ] **Step 2: `components/PaketKarti.tsx` dosyasını tümüyle değiştir**

```tsx
import Link from 'next/link';
import type { Paket } from '@/lib/game/types';
import { paketRenkleri } from '@/lib/game/renk';

interface Props {
	paket: Paket;
	enIyi: number | null;
	yuklendi: boolean;
}

export function PaketKarti({ paket, enIyi, yuklendi }: Props) {
	const maksimum = paket.soru_ids.length * 100;
	const { zemin, metin } = paketRenkleri(paket);
	const monogram = paket.baslik.trim().charAt(0).toLocaleUpperCase('tr');

	return (
		<Link href={`/paket/${paket.slug}`} className="block">
			<div
				className="flex aspect-[4/5] flex-col justify-between rounded-xl p-3"
				style={{ background: zemin, color: metin }}
			>
				<div className="flex items-start justify-between">
					<span
						className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium"
						style={{ background: 'rgba(255, 255, 255, 0.1)' }}
						aria-hidden
					>
						{monogram}
					</span>
					<span
						className="rounded-full px-2 py-0.5 text-[10px]"
						style={{ background: 'rgba(255, 255, 255, 0.1)' }}
					>
						{paket.soru_ids.length} soru
					</span>
				</div>
				<span className="text-lg font-medium leading-tight">{paket.baslik}</span>
			</div>
			{/* Kayit okunmadan once "oynanmadı" demek yanlis olabilir; satir yer tutar. */}
			<p className="mt-2 text-xs text-[var(--metin-soluk)]">
				{!yuklendi ? ' ' : enIyi === null ? 'oynanmadı' : `en iyi ${enIyi} / ${maksimum}`}
			</p>
		</Link>
	);
}
```

- [ ] **Step 3: Testleri ve derlemeyi çalıştır**

Run: `npm test`
Expected: PASS — 115 + Task 1'in testleri

Run: `npm run build`
Expected: başarılı

- [ ] **Step 4: Commit**

```bash
git add app/globals.css components/PaketKarti.tsx
git commit -m "feat: portre paket karti ve kisilmis sayfa yuzeyleri"
```

---

### Task 3: Mat günlük blok ve çalışan filtre

**Files:**
- Modify: `components/GunlukKapak.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: mevcut props, `PAKETLER`
- Produces: görsel değişiklik ve ızgara filtresi

**Filtre kuralı — dikkat:** Pill'ler dekoratif değil. İki seçenek var ve ikisi de gerçekten çalışır: **Tümü** bütün paketleri, **Oynanmadı** yalnızca kaydı olmayanları gösterir. Kayıt okunmadan (`yuklendi === false`) hangi paketin oynandığı bilinmediği için filtre o anda uygulanmaz; seçim `Tümü` başlar.

- [ ] **Step 1: `components/GunlukKapak.tsx` içindeki üç dönüşü matlaştır**

Yalnızca sınıf ve renk değişiyor; koşullar, metinler ve props aynı kalıyor.

Yer tutucu dönüşünde dış `div`'in sınıfını şununla değiştir:

```
className="flex items-end justify-between gap-4 rounded-xl border border-[var(--kenar)] p-5"
```

ve içindeki yer tutucu düğmenin sınıfını şununla değiştir:

```
className="whitespace-nowrap rounded-full border border-[var(--kenar)] px-5 py-2.5 font-medium text-transparent"
```

`no === null` dönüşünde dış `div`'in sınıfını şununla değiştir:

```
className="rounded-xl border border-[var(--kenar)] p-5"
```

Ana dönüşte dış `div`'in sınıfını şununla değiştir:

```
className="flex items-end justify-between gap-4 rounded-xl border border-[var(--kenar)] p-5"
```

ve `Link`'in sınıfını şununla değiştir:

```
className="whitespace-nowrap rounded-full bg-[var(--metin)] px-5 py-2.5 text-sm font-medium text-[var(--zemin)]"
```

Ayrıca ana dönüşteki `No. {no}` satırının sınıfını `text-3xl font-medium` yerine `text-2xl font-medium` yap — mat ton daha sessiz tipografi istiyor.

- [ ] **Step 2: `app/page.tsx` dosyasını tümüyle değiştir**

```tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PAKETLER, TAKVIM } from '@/lib/game/bank';
import { bugununTarihi, gunuBul } from '@/lib/game/daily';
import { kaydiOku, gecerliStreak, BOS_KAYIT, type OyunKaydi } from '@/lib/game/storage';
import { PaketKarti } from '@/components/PaketKarti';
import { GunlukKapak } from '@/components/GunlukKapak';

type Suzgec = 'tumu' | 'oynanmadi';

export default function AnaSayfa() {
	const [kayit, setKayit] = useState<OyunKaydi>(BOS_KAYIT);
	const [tarih, setTarih] = useState('');
	const [yuklendi, setYuklendi] = useState(false);
	const [suzgec, setSuzgec] = useState<Suzgec>('tumu');

	useEffect(() => {
		setKayit(kaydiOku());
		setTarih(bugununTarihi());
		setYuklendi(true);
	}, []);

	const gun = tarih ? gunuBul(TAKVIM, tarih) : null;
	const streak = tarih ? gecerliStreak(kayit, tarih) : 0;
	const tarihMetni = tarih
		? new Date(tarih + 'T00:00:00Z').toLocaleDateString('tr-TR', {
				day: 'numeric',
				month: 'long',
				timeZone: 'UTC'
			})
		: '';

	// Kayit okunmadan hangi paketin oynandigini bilmiyoruz; suzgec o ana kadar uygulanmaz.
	const gorunenPaketler = useMemo(
		() =>
			!yuklendi || suzgec === 'tumu'
				? PAKETLER
				: PAKETLER.filter((p) => kayit.paketler[p.slug] === undefined),
		[yuklendi, suzgec, kayit]
	);

	return (
		<main className="mx-auto max-w-3xl p-5">
			<header className="mb-6 flex items-center justify-between">
				<span className="text-lg font-medium">Kaç?</span>
				{streak > 0 && (
					<span className="rounded-full border border-[var(--kenar)] px-3 py-1 text-xs text-[var(--metin-ikincil)]">
						seri {streak}
					</span>
				)}
			</header>

			<GunlukKapak
				no={gun?.no ?? null}
				tarihMetni={tarihMetni}
				streak={streak}
				oynandi={tarih in kayit.gunluk}
				yuklendi={yuklendi}
			/>

			<div className="mt-6 flex gap-2">
				{([
					['tumu', 'Tümü'],
					['oynanmadi', 'Oynanmadı']
				] as const).map(([deger, etiket]) => (
					<button
						key={deger}
						type="button"
						onClick={() => setSuzgec(deger)}
						aria-pressed={suzgec === deger}
						className={
							'rounded-full px-3 py-1 text-xs transition ' +
							(suzgec === deger
								? 'bg-[var(--metin)] text-[var(--zemin)]'
								: 'border border-[var(--kenar)] text-[var(--metin-ikincil)]')
						}
					>
						{etiket}
					</button>
				))}
			</div>

			{gorunenPaketler.length === 0 ? (
				<p className="mt-6 text-sm text-[var(--metin-ikincil)]">
					Bütün paketleri oynamışsın.
				</p>
			) : (
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{gorunenPaketler.map((p) => (
						<PaketKarti
							key={p.slug}
							paket={p}
							enIyi={kayit.paketler[p.slug]?.enIyi ?? null}
							yuklendi={yuklendi}
						/>
					))}
				</div>
			)}

			<nav className="mt-8 text-sm text-[var(--metin-soluk)]">
				<Link href="/arsiv">Arşiv</Link>
			</nav>
		</main>
	);
}
```

- [ ] **Step 3: Testleri ve derlemeyi çalıştır**

Run: `npm test`
Expected: PASS

Run: `npm run build`
Expected: başarılı, 13 sayfa

- [ ] **Step 4: Commit**

```bash
git add components/GunlukKapak.tsx app/page.tsx
git commit -m "feat: mat gunluk blok ve calisan paket suzgeci"
```

---

### Task 4: Sonuç ekranında hesap yedeği

**Files:**
- Modify: `components/SonucKarti.tsx`

**Interfaces:**
- Consumes: `hesabiSec`, `Hesap` (Task 1)
- Produces: görsel değişiklik, yeni dışa aktarım yok

Seçim mantığı Task 1'de `hesabiSec` içine alındı ve test edildi; burası yalnızca çiziyor.

**Bu task'ın gerekçesi plan yazıldıktan sonra daraldı, dürüst olalım:** başlangıçta 20 soruda `napkin` eksikti ve o sorularda hiçbir hesap görünmüyordu. Banka hattı boşluğu veri tarafında kapattı, dolayısıyla `math` yedeği bugün hiçbir soruyu kurtarmıyor. Task yine de yapılıyor çünkü üç şey birden getiriyor: mat kenar stiline geçiş, aşağıdaki React anahtar kusurunun kapanması, ve banka büyüdüğünde boş bölüm yerine hesap gösterecek ucuz bir sigorta.

Kapanan mevcut kusur: satırlar `key={etiket}` kullanıyor, aynı etiketli iki satır React anahtarı çakışması yaratır. Dizin anahtarına geçiliyor.

- [ ] **Step 1: `components/SonucKarti.tsx` dosyasını tümüyle değiştir**

```tsx
import type { Soru } from '@/lib/game/types';
import { oran, oranMetni } from '@/lib/game/scoring';
import { sayiMetni } from '@/lib/game/format';
import { hesabiSec } from '@/lib/game/hesap';

interface Props {
	soru: Soru;
	cevap: number;
	puan: number;
}

export function SonucKarti({ soru, cevap, puan }: Props) {
	const hesap = hesabiSec(soru);

	return (
		<div className="rounded-xl border border-[var(--kenar)] p-4">
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
					{hesap && (
						<div className="mt-4 rounded-lg bg-[var(--yuzey)] p-3">
							<p className="text-sm font-medium">{hesap.baslik}</p>
							{hesap.lead && (
								<p className="mt-1 text-sm text-[var(--metin-ikincil)]">{hesap.lead}</p>
							)}
							<dl className="mt-3">
								{hesap.rows.map(([etiket, deger], i) => (
									<div key={i} className="flex justify-between py-1 text-sm">
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

- [ ] **Step 2: Tam geçiş**

Run: `npm test`
Expected: PASS — bütün testler

Run: `npx tsc --noEmit`
Expected: temiz, çıkış kodu 0

Run: `npm run build`
Expected: başarılı, 13 sayfa

- [ ] **Step 3: Commit**

```bash
git add components/SonucKarti.tsx
git commit -m "feat: napkin yoksa math hesabini goster"
```

---

## Kapsam dışı

Poster görselleri, yeni paket, veri değişikliği, oyun kuralı değişikliği, veritabanı, yayına çıkarma. Slider adım yoğunluğu ve `sayiCozumle`'nin üç-basamaklı ondalık kenar durumu da ayrı bir turun işi.
