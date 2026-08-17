# Kaç? — Oyun ve Arayüz Tasarımı

**Tarih:** 2026-08-17
**Durum:** onaylandı, uygulanmayı bekliyor
**Kapsam:** oyun mantığı + web arayüzü. Hesap, sıralama tablosu, oyuncu dağılımı ve 1000 soruluk bankanın üretimi bu turun dışında.
**Öncül:** [TR soru bankası tasarımı](2026-08-17-tr-soru-bankasi-design.md) — şema ve içerik hattı orada tanımlı, burada tüketiliyor.

## Amaç

fermi.gg'nin tahmin oyunu mantığını Türkçe içerikle, Posh (Mobbin referansı) tarzı karanlık bir keşif ızgarasında çalıştırmak. İki soru tipi tek oyunda birleşir: sayısal büyüklük tahmini (`fermi`) ve çoktan seçmeli bilgi (`mcq`).

Çalışma adı **Kaç?** — hem sorunun kendisi hem oyunun adı. Paylaşım metninde `Kaç? · No. 23` olarak görünür.

## Referans: fermi.gg'nin gerçek mekaniği

Uygulama bundle'ından çıkarıldı (`data/raw/.bundle-raw.js`), tasarımın dayanağı:

- Skor bir **oran**: `max(tahmin, cevap) / min(tahmin, cevap)`, düşük iyi. Günün skoru üç sorunun ortalaması, her biri 1000× ile sınırlı.
- Girdi **logaritmik slider**: 61 kademe (0–60), değer `10^(kademe/10)` → 1'den 1.000.000'a.
- Dağılım **11 kovalı**: `≤1.2×` merkez, sonra `1.5× / 2× / 5× / 10×` bantları düşük ve yüksek yönde ayrı.
- Paylaşım metni satır satır `01 1.34×` biçiminde.

Oran mantığı bizde puana çevriliyor — gerekçe aşağıda.

## Kararlar

| Konu | Karar | Gerekçe |
|---|---|---|
| Oyun döngüsü | Paket ızgarası + sabit günlük bulmaca | Izgara arayüzünün gezilecek içeriğe ihtiyacı var; günlük bulmaca alışkanlığı taşır |
| Soru karışımı | Karışık paket (3 fermi + 7 mcq) | Oyunun imzası olan peçete hesabı her pakette çıkar; MCQ hacmi taşır |
| Skor | Soru başına 0–100 puan | `×` oranı çoktan seçmeliyle aynı para birimine çevrilmiyor |
| Kalıcılık | Backend yok, localStorage | Statik çıktı, sıfır maliyet, hızlı yayın |
| Ana ekran | Tam genişlikte günlük kapak + altında ızgara | Günlük alışkanlık kaydırma insafına bırakılmamalı |
| Kapak sanatı | Tipografik (renk + iri başlık) | Görsel üretmeden ölçeklenir, kartlar tamamen kodla türetilir |
| Tahmin girişi | Logaritmik slider + senkron yazılı giriş | Slider büyüklük sezgisini verir, klavye kesinliği verir |
| Tohum veri | 4 paket × 10 soru = 40 gerçek TR sorusu | Ekranlar gerçek metin uzunluklarıyla sınanır |

## Yığın

Next.js (App Router) + TypeScript + Tailwind, `output: 'export'` ile statik çıktı. Sunucu yok, çalışma zamanı yok. Vercel'e statik olarak çıkar.

## Puanlama

`lib/game/scoring.ts` — saf, DOM bilmez.

```
oran = max(tahmin, cevap) / min(tahmin, cevap)
puan = round(100 × clamp(1 − log10(oran) / 2, 0, 1))
```

| oran | 1.0× | 1.2× | 1.5× | 2× | 5× | 10× | 100× |
|---|---|---|---|---|---|---|---|
| puan | 100 | 96 | 91 | 85 | 65 | 50 | 0 |

Sınır davranışı: `tahmin ≤ 0` veya sonlu olmayan değer → oran sonsuz → 0 puan. MCQ: doğru 100, yanlış 0.

Paket skoru puanların toplamı, 10 soruluk pakette 1000 üzerinden gösterilir. Sonuç ekranında fermi soruları için `×` sapması ayrıca yazılır — asıl lezzet orada, puan yalnızca ortak para birimi.

## Günlük bulmaca

Çalışma zamanında tarihten hash türetmek yerine derleme anında takvim üretilir: `scripts/build-calendar.mjs` → `data/bank/calendar.json`, tarih → 3 soru kimliği. Çıktı dosyaya yazılı olduğu için herkeste aynı, gözle denetlenebilir ve tekrar kontrolü script içinde yapılır.

Saat dilimi **Europe/Istanbul**. Gün sınırı yerel gece yarısı.

Tohum sette 40 soru olduğu için ilk takvim yaklaşık iki haftayı kapsar; banka dolduğunda script yeniden çalıştırılır.

## Kalıcılık

`lib/game/storage.ts` localStorage'ın tek kapısı — başka hiçbir dosya doğrudan dokunmaz.

Tutulanlar: streak (son oynanan tarih + sayı), günlük bulmaca geçmişi (tarih → puan), paket başına en iyi skor ve tamamlanma zamanı.

Streak kuralı: ardışık gün oynanırsa +1, bir gün atlanırsa 1'e döner, aynı gün ikinci kez oynamak seriyi artırmaz. Bozuk veya eksik localStorage okunamazsa oyun sıfırdan başlar, çökmez.

## Ekranlar

| Rota | İş |
|---|---|
| `/` | Günlük kapak bloğu + paket ızgarası |
| `/gunluk` | Bugünün 3 sorusu |
| `/paket/[slug]` | Paketin 10 sorusu |
| `/sonuc` | Soru soru döküm, toplam puan, panoya paylaşım metni |
| `/arsiv` | Geçmiş günler, oynanmışlar skorla işaretli |

Oyun ekranı tek bileşen: soru tipine göre slider ya da dört şık gelir; ilerleme, cevabı kilitleme ve sonuç açılışı ortak. Günlük ile paket arasındaki tek fark hangi soru dizisinin beslendiği.

Sonuç açılışında fermi sorusu için doğru cevap, sapma ve **peçete hesabı** (`napkin`) gösterilir; MCQ için doğru şık ve `explanation`.

Karanlık tema, tipografik kapaklar: her pakete `packs.json` içinde bir koyu zemin ve açık metin rengi yazılır, kart bu ikisiyle kodla türetilir.

Filtre çipleri bu turda **girmiyor** — dört pakette süs olur, 15 paketi geçince anlamlı hale gelir.

## Veri

Soru şeması öncül tasarımda tanımlı (`fermi` / `mcq` ortak zarf) ve değişmiyor. Bu tur `data/bank/` altına tohum içeriği yazar — `fermi.json` (12 soru) ve `mcq.json` (28 soru), şemaya birebir uyumlu — ve iki dosya daha ekler:

`data/bank/packs.json` — paket başına: `slug`, `baslik`, `renk`, `metin_rengi`, `soru_ids[]` (3 fermi + 7 mcq).

`data/bank/calendar.json` — `[{ tarih, no, soru_ids[3] }]`.

Tohum paketler: Sayılarla İstanbul, Dünyayı Ölçmek, Mutfaktaki Fizik, Tarihin Rakamları.

## Modül sınırları

- `lib/game/scoring.ts` — oran ve puan. Saf. Soru şemasını bilir, React'i bilmez.
- `lib/game/daily.ts` — takvimden bugünün bulmacasını çözer. Saat dilimini burada ele alır. Saf.
- `lib/game/storage.ts` — localStorage sarmalayıcı. Tek yazma noktası, bozuk veriye dayanıklı.
- `lib/game/types.ts` — banka şeması tipleri, tek doğruluk kaynağı.
- `components/` — sunum. Oyun kuralı içermez, puanı hesaplamaz.

## Test planı

Vitest, önce test. Üç saf modülün tamamı doğrudan test edilebilir.

- `scoring` — sınır oranlar (1×, 1.2×, 2×, 10×, 100×, 1000×), sıfır ve negatif tahmin, sonlu olmayan girdi, MCQ ikili puan, paket toplamı
- `daily` — aynı tarih hep aynı bulmacayı verir, takvimde soru tekrarı yok, gün sınırı (23:59 → 00:01), takvim dışı tarih
- `storage` — streak artışı, atlanan günde sıfırlanma, aynı günü iki kez oynama, bozuk JSON'dan kurtulma, en iyi skorun düşük skorla ezilmemesi

Bileşen testi kapsam dışı; kural mantığı zaten saf modüllerde.

## Bilerek dışarıda bırakılanlar

**Oyuncu dağılımı histogramı.** Backend yok, gerçek veri yok. Uydurma histogram oyunun en dürüst anını sahtelemek olur. Sonuç ekranı bunun yerine doğru cevap ve peçete hesabı üzerine kuruluyor. Backend turu gelirse gerçek veriyle eklenir.

Ayrıca: hesap, cihazlar arası senkron, sıralama tablosu, bildirim, filtre çipleri, 1000 soruluk bankanın üretimi.

## Sıralama

1. `lib/game/` saf modülleri, testleriyle
2. Tohum veri: 40 soru + `packs.json` + `build-calendar.mjs`
3. Oyun ekranı (slider, şıklar, kilitleme, sonuç açılışı)
4. Ana ekran, paket ve günlük rotaları
5. Sonuç ve arşiv ekranları, panoya paylaşım
