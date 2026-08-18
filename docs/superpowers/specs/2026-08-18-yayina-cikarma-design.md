# Kaç? — Yayına Çıkarma

**Tarih:** 2026-08-18
**Durum:** onaylandı, uygulanmayı bekliyor
**Kapsam:** yalnızca dağıtım. Kod değişikliği yok, veri değişikliği yok, oyun mantığı değişikliği yok.
**Öncül:** [oyun ve arayüz](2026-08-17-oyun-ve-arayuz-design.md), [mat arayüz](2026-08-17-mat-arayuz-design.md)

## Amaç

Oyunu canlıya çıkarmak ve her push'ta kendiliğinden güncellenen bir boru hattı kurmak.

Bu tur veritabanından önce geliyor. Gerekçe: uygulama zaten statik ve yayına çıkmaya hazır;
mimariyi değiştiren veritabanı kararlarını gerçek kullanımdan geri bildirim almadan vermek
yerine, önce oyunu ortaya çıkarıp sonra o kararları vermek daha sağlam.

## Ne yayınlanıyor

Mevcut statik çıktı, olduğu gibi. `next.config.mjs` zaten `output: 'export'`; Vercel'in
yapacağı şey `npm run build` çalıştırıp `out/` klasörünü servis etmek. Sunucu yok, çalışma
zamanı yok, ortam değişkeni yok, gizli anahtar yok.

Yayınlanan içerik: 6 paket, 224 fermi + 781 mcq sorusu, 102 günlük takvim (2026-08-17 →
2026-11-26). Banka paralel bir oturum tarafından büyütülmeye devam ediyor.

## Boru hattı

1. Yereldeki commit'ler `origin/main`'e push edilir. Depo (`OmerHarmankayaC/quiz`) zaten
   herkese açık; sırlar için tarandı, temiz. 2.8 GB'lık `data/embed_data_copy/` gitignore'da,
   push'a girmiyor.
2. Vercel projesi GitHub reposuna bağlanır.
3. Her `main` push'u üretime çıkar.

Banka oturumu sık commit attığı için ilk gün çok sayıda dağıtım tetiklenir. Zararsız:
her dağıtım bağımsız, başarısız olan bir öncekini düşürmez.

## Proje adı ve alan adı

Vercel proje adı `kac`, varsayılan alan adı `kac.vercel.app`. Alınmışsa Vercel sonek ekler.
Özel alan adı bu turun dışında.

## Bilerek kabul edilen ödünç

**Cevaplar istemci paketinde okunabilir kalıyor.** 102 günlük takvimin tamamı, soruları ve
cevaplarıyla birlikte tarayıcıya iniyor; devtools açan biri önümüzdeki üç ayı görebilir.

Bunu gizlemeye çalışmak — şifreleme, karıştırma, kodlama — tiyatro olurdu: istemciye giden
her şey istemcide okunabilir. Doğru çözüm soruları sunucuya taşımak, o da veritabanı turunun
işi. İlk sürümde bilinçli ödünç olarak kayda geçiriliyor.

İkinci ve bağlantılı ödünç: bütün banka tek chunk'ta istemciye iniyor (640 KB ham JS, sayfa
başına ~280 KB ilk yük). Aynı çözüm ikisini birden kapatıyor.

## Temizlik

`web-deneme/` depodan kaldırılır. Terk edilmiş, yarım kalmış ikinci bir Next.js iskeleti;
gerçek uygulama depo kökünde. Herkese açık bir depoda hangisinin gerçek olduğunu belirsiz
kılıyor. Git geçmişinde kalacağı için geri alınabilir.

## Doğrulama

Dağıtım sonrası canlı URL'de uçtan uca gezinti: ana ekran, günlük bulmaca, bir paket,
sonuç ekranı, arşiv. Özellikle rota çözümlemesi — statik export uzantısız URL'leri
(`/arsiv`, `/paket/<slug>`) barındırıcının yeniden yazımına bırakıyor; yerelde çalışan
bir şey yayında kırılabilir, tam da orada kontrol edilecek.

## Kapsam dışı

Veritabanı, hesap, sıralama tablosu, oyuncu dağılımı, özel alan adı, analitik, hata izleme,
SEO/meta etiketleri, paket boyutu optimizasyonu.
