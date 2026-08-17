# Kaç? — Mat Arayüz Revizyonu

**Tarih:** 2026-08-17
**Durum:** onaylandı, uygulanmayı bekliyor
**Kapsam:** yalnızca görsel katman. Oyun kuralları, puanlama, kalıcılık, rotalar ve veri değişmiyor.
**Öncül:** [oyun ve arayüz tasarımı](2026-08-17-oyun-ve-arayuz-design.md) — yapı orada kuruldu, burada giydiriliyor.

## Amaç

Arayüzü Posh (Mobbin referansı) diline yaklaştırmak ve genel tonu matlaştırmak. İlk tur çalışan bir oyun üretti ama görsel dil referanstan iki noktada ayrıldı: kartlar yatık ve başlık içeride kalıyor, renkler ve metin kontrastı fazla parlak.

## Kararlar

| Konu | Karar | Gerekçe |
|---|---|---|
| Kart anatomisi | Portre oran, rozet + pill, başlık kart dibinde | Posh'un iskeleti; kart yüzü görsel üretmeden tipografiyle taşınır |
| Renk | `data/` değil, kodda türetilen mat palet | `packs.json` paralel oturumun dosyası; iki oturum aynı dosyaya yazmamalı |
| Günlük blok | Yerinde kalır, Posh diliyle giyinir | Günlük alışkanlık oyunun çekirdeği; kaydırma insafına bırakılmaz |
| Peçete hesabı | `napkin` yoksa `math` gösterilir | 20 soruda yalnızca `math` var, şu an hiçbir şey görünmüyor |

## Mat palet

Paket renkleri `data/bank/packs.json` içinde ve o dosya soru bankası hattına ait. Renk revizyonu veriye dokunmadan, `lib/game/renk.ts` içindeki saf fonksiyonlarla yapılır. Yeni paket eklendiğinde kendiliğinden uyar.

```
zemin = doygunluguDusur(paket.renk, 0.3)
metin = karistir(paket.metin_rengi, zemin, 0.28)
```

`doygunluguDusur` rengi kendi parlaklık grisine doğru çeker; `karistir` iki rengi doğrusal harmanlar.

Katsayılar ölçülerek seçildi. `0.5` ve üzeri doygunluk düşüşünde altı paket birbirine yaklaşıp kimliğini kaybediyor; `0.3` moru mor, teali teal bırakıyor. Metin için doygunluk düşürmek yanlış araç — mat his kontrastın düşmesinden geliyor, o yüzden metin zemine karıştırılarak kısılıyor.

| Paket | zemin | metin | kontrast |
|---|---|---|---|
| tarihin-rakamlari | `#34211e` | `#c3b2ac` | 7,44 |
| dunyayi-olcmek | `#172f2c` | `#aabeb8` | 7,28 |
| mutfaktaki-fizik | `#2b241b` | `#beb5a6` | 7,55 |
| ekranlar-ve-sesler | `#2e1d29` | `#c1afbb` | 7,64 |
| bilim-ve-uzay | `#27234d` | `#b6b4cc` | 7,25 |
| sahada-ve-pistte | `#1f2934` | `#adb8c3` | 7,31 |

Hepsi WCAG AA'nın gövde metni eşiğinin (4,5) üstünde. Mat, okunaksız demek değil.

Sayfa değişkenleri de kısılır: `--yuzey` `#1a1a18` → `#141414` (nötr), `--kenar` `#2c2c2a` → `#232323`.

## Kart anatomisi

`h-40` sabit yükseklik yerine `aspect-[4/5]` portre oran.

Kart içinde, yukarıdan aşağı:
- Sol üstte konu ikonu için yuvarlak rozet (yarı saydam beyaz zemin)
- Sağ üstte soru sayısı pill'i
- Dipte başlık — kartın taşıdığı asıl şey

Kartın altında, Posh'un mekân satırı gibi: en iyi skor ya da "oynanmadı".

İkon paket başına sabit bir eşlemeden gelir (`lib/game/ikon.ts`), `packs.json`'a alan eklenmez — o dosya bu turun kapsamı dışında.

## Sayfa kabuğu

Günlük blok: daha sessiz zemin, ince kenar, pill biçimli "Oyna" düğmesi, kısılmış tipografi.

Üst çubuk: Posh'un pill kontrol dili. Bu turda pill'ler **dekoratif değil işlevsel olmalı** ya da hiç konmamalı — çalışmayan bir filtre çubuğu koymak arayüzü zenginleştirmez, yalan söyler. Altı pakette anlamlı tek kontrol sıralama: "Tümü" ve "Oynanmadı". İkisi gerçekten çalışır.

## Sonuç ekranı

Bugünkü davranış: `napkin` varsa peçete bölümü gösteriliyor, yoksa hiçbir şey.

Veri gerçeği (2026-08-17, commit `ce05c30` sonrası): 224 fermi sorusunun 204'ünde `napkin`, 179'unda `math`, 159'unda ikisi de var. **20 soruda yalnızca `math` var** ve o sorularda ekran şu an boş kalıyor.

Yeni davranış:
1. `napkin` varsa o gösterilir — oyuncunun sıfırdan nasıl akıl yürüteceğini anlatan asıl öğretici içerik odur.
2. Yoksa `math` satırları gösterilir, başlık "Nasıl hesaplanıyor".
3. İkisi de yoksa bölüm hiç görünmez.

İkisi birden gösterilmez: `napkin` tahmin zincirini, `math` gerçek türetmeyi anlatıyor; yan yana konunca sonuç ekranı iki rakip hesapla kalabalıklaşıyor.

## Kapsam dışı

Poster görselleri üretimi, yeni paket, veri değişikliği, oyun kuralı değişikliği, veritabanı, yayına çıkarma. Slider adım yoğunluğu ve `sayiCozumle`'nin üç-basamaklı ondalık kenar durumu da bu turun dışında — ayrı bir turda ele alınacak.

## Sıralama

1. `lib/game/renk.ts` — saf renk fonksiyonları, testleriyle
2. Sayfa değişkenleri ve kart anatomisi
3. Günlük blok ve üst çubuk
4. Sonuç ekranında `math` yedeği
