# TR Tahmin & Bilgi Soru Bankası — Tasarım

**Tarih:** 2026-08-17
**Durum:** onaylandı, uygulanıyor
**Kapsam:** yalnızca veri katmanı. Site/UI, skorlama, günlük puzzle rotasyonu bu turun dışında.

## Amaç

fermi.gg tarzı bir tahmin oyunu için Türkçe soru bankası kurmak — iki modlu:

- **fermi** — sayısal büyüklük tahmini, cevaba ne kadar yakınsan o kadar iyi
- **mcq** — çoktan seçmeli bilgi sorusu

Hedef ölçek: ~1.000 soru (Fermi ~350, MCQ ~650). Günde 3 soruyla yaklaşık bir yıllık içerik.

## Girdi verisi

| Kaynak | İçerik | Kullanım |
|---|---|---|
| `data/raw/questions.json` | fermi.gg'den çıkarılmış 255 soru (EN) | Fermi hattı için referans ve iskelet |
| `data/embed_data_copy/sorular_filtreli.jsonl` | 136K (query, pos, kaynak_id) TR | MCQ aday havuzu |
| `data/embed_data_copy/islenmis/paragraflar.jsonl` | 300K TR wiki paragrafı | Kaynak metin, MCQ dayanağı |
| `data/embed_data_copy/train.jsonl` | 134K, `negs` hard negative'ler | Çeldirici bağlamı |
| `data/embed_data_copy/embeddings/korpus_e5_small.dat` | 300K × 384 float32 | Semantik komşuluk |

Embedding dosyası `paragraflar.jsonl`'in ilk 300.000 satırıyla sırayla hizalı: 460.800.000 bayt ÷ 300.000 ÷ 4 = 384 boyut. Meta dosyası eksik olduğu için bu hizalama scriptte açıkça doğrulanır.

## Şema

İki mod tek zarfı paylaşır, gövdeleri ayrışır.

Ortak: `id`, `mode`, `prompt`, `topics[]`, `difficulty` (1–3), `source`, `source_url`, `origin`, `verified_at`

| mode | ek alanlar |
|---|---|
| `fermi` | `answer` (sayı), `unit`, `math[]`, `napkin` |
| `mcq` | `choices[4]`, `correct_index`, `explanation`, `kaynak_id`, `kaynak_baslik` |

`origin` kaynak izini tutar: `translated` (fermi.gg'den düz çeviri), `adapted` (TR'ye uyarlanmış), `original` (sıfırdan), `wiki` (embed verisinden). Telif sorusu gelirse hangi sorunun nereden geldiği tek alanda görünür.

## Fermi hattı (~350)

255 soru üç kovaya ayrılır:

- **Evrensel** (~120) — dünya geneli geçerli, düz çevrilir → `origin: translated`
- **Uyarlanabilir** (~110) — iskelet korunur, bağlam ve cevap TR'ye taşınır → `origin: adapted`
- **Elenen** (~25) — TR oyuncusunun tahmin zinciri kuramayacağı sorular

Üstüne ~150 özgün TR sorusu → `origin: original`.

**Darboğaz cevap, soru değil.** Doğrulanabilir sayı üretmenin üç katmanı:

1. Türetilebilir — nüfus × bilinen oran, hesap `math` alanında açık
2. Sabit/coğrafi — güvenli
3. Geri kalan — hedefli web araması ile doğrulanır

Doğrulanamayan cevap bankaya girmez. `verified_at` her cevabın doğrulanma zamanını taşır; bu sayılar zamanla kayar.

## MCQ hattı (~650)

Cevap kaynak paragrafın içinde olduğu için doğrulama sorunu yok. İki aşama:

**`scripts/mcq-candidates.mjs`** (otomatik, LLM'siz):

1. `sorular_filtreli.jsonl`'den aday süz — soru uzunluğu, `pos` içinde somut sayı/özel isim
2. Konu çeşitliliği: `kaynak_id`'nin sayfa parçasına göre grupla, sayfa başına en fazla 1 soru
3. Embedding komşularını çek → yakın paragrafların başlıkları, çeldirici malzemesi
4. `data/work/mcq-candidates.jsonl` yaz (~800 aday, 650 hedef + fire payı)

**Sonra üretim:** her adaydan soru + 4 şık + açıklama yazılır.

`negs` paragrafları doğrudan şık olamaz — şık kısa bir cevap, `negs` koca bir paragraf. Embedding ve `negs`'in işlevi "aynı konuda ne var, hangi yakın bilgi karıştırılabilir" bağlamını vermek; çeldirici o bağlamdan yazılır.

## Kalite kapısı

`scripts/validate-bank.mjs` — commit öncesi çalışır:

- şema uygunluğu, `prompt` bazlı dedup
- MCQ: 4 şıkkın tekilliği, `correct_index` geçerliliği, şık uzunluk dengesi (en uzun şık hep doğru cevap olmamalı — klasik sızıntı)
- Fermi: `answer > 0`, `source` doluluğu

## Repo düzeni

```
data/raw/     fermi.gg çıktısı (referans)
data/bank/    fermi.json, mcq.json  ← ürün
data/work/    ara dosyalar (gitignore)
scripts/      mcq-candidates.mjs, validate-bank.mjs
```

`data/embed_data_copy/` (2.8GB) ve `data/work/` gitignore'da.

## Telif notu

fermi.gg robots.txt'i `Content-Signal: ai-train=no, use=reference` diyor. `translated` kovası bu sınıra en yakın duran kısım; `adapted` ve `original` sorular kendi içeriğimiz. Ölçek büyürse `translated` payı azaltılmalı.

## Sıralama

1. `.gitignore` + repo düzeni
2. MCQ aday scripti
3. Fermi triage → çeviri/uyarlama
4. MCQ üretimi
5. Doğrulama scripti + tam geçiş
