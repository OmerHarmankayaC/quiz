/**
 * Tohum veriyi repo bankasından türetir.
 *
 *   ../data/bank/{fermi,mcq}.json  ->  data/bank/{fermi,mcq,packs,calendar}.json
 *
 * Çalışma zamanında hiçbir şey türetilmez: paket dağılımı da takvim de
 * derleme anında dosyaya yazılır, böylece herkeste aynı ve gözle denetlenebilir.
 * Script deterministiktir; iki kez çalıştırmak aynı çıktıyı verir.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const buradan = dirname(fileURLToPath(import.meta.url))
const KOK = join(buradan, '..')
const KAYNAK = join(KOK, '..', 'data', 'bank')
const HEDEF = join(KOK, 'data', 'bank')

const TAKVIM_BASLANGIC = '2026-08-17'
const PAKET_FERMI = 3
const PAKET_MCQ = 7
const GUNLUK_FERMI = 1
const GUNLUK_MCQ = 2
/** Slider bandı kaç ondalık basamak genişliğinde olsun. */
const BAND_GENISLIGI = 8

const PAKET_TANIMLARI = [
  {
    slug: 'dunyayi-olcmek',
    baslik: 'Dünyayı Ölçmek',
    aciklama: 'Mesafeler, yükseklikler, gezegenin kaba ölçüleri.',
    renk: '#0F3A38',
    metin_rengi: '#86EFD3',
    konular: ['coğrafya', 'doğa', 'uzay', 'çevre', 'denizcilik'],
  },
  {
    slug: 'tarihin-rakamlari',
    baslik: 'Tarihin Rakamları',
    aciklama: 'Yıllar, ordular, imparatorluklar ve sayıları.',
    renk: '#3B1E15',
    metin_rengi: '#F0A87B',
    konular: ['tarih', 'siyaset', 'mimari', 'din'],
  },
  {
    slug: 'mutfaktaki-fizik',
    baslik: 'Mutfaktaki Fizik',
    aciklama: 'Tabaktan başlayıp doğa yasalarına çıkan sorular.',
    renk: '#2A3117',
    metin_rengi: '#D3E87F',
    konular: ['fizik', 'yiyecek', 'bilim', 'biyoloji', 'sağlık', 'hayvan'],
  },
  {
    slug: 'sahada-ve-sahnede',
    baslik: 'Sahada ve Sahnede',
    aciklama: 'Maçlar, şarkılar, filmler; kültürün ölçülebilir yanı.',
    renk: '#161F42',
    metin_rengi: '#A3BCFF',
    konular: ['spor', 'müzik', 'film', 'oyun', 'kültür', 'tiyatro', 'kitap'],
  },
]

// --- yardımcılar ---------------------------------------------------------

function oku(ad) {
  return JSON.parse(readFileSync(join(KAYNAK, ad), 'utf8'))
}

function yaz(ad, veri) {
  mkdirSync(HEDEF, { recursive: true })
  writeFileSync(join(HEDEF, ad), JSON.stringify(veri, null, 2) + '\n', 'utf8')
  return Array.isArray(veri) ? veri.length : Object.keys(veri).length
}

/** id'den türeyen kararlı sayı. Rastgelelik yok, tekrar çalıştırınca aynı. */
function tohum(id) {
  let h = 2166136261
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * Sorunun slider bandı: 8 ondalık basamak genişliğinde, cevabın bant içindeki
 * yeri id'ye göre kayıyor. Sabit bir band olsaydı oyuncu cevabın hep ortada
 * durduğunu öğrenirdi.
 */
function bandHesapla(soru) {
  const basamak = Math.floor(Math.log10(soru.answer))
  const kayma = (tohum(soru.id) % (BAND_GENISLIGI - 2)) + 1
  const alt = basamak - kayma
  return { alt_us: alt, ust_us: alt + BAND_GENISLIGI }
}

function gunEkle(tarih, fark) {
  const [y, a, g] = tarih.split('-').map(Number)
  return new Date(Date.UTC(y, a - 1, g + fark)).toISOString().slice(0, 10)
}

function konuEslesiyor(soru, konular) {
  return soru.topics.some((t) => konular.includes(t))
}

/** Havuzdan `adet` soru seçer, seçilenleri havuzdan düşer. */
function sec(havuz, adet, sartlar) {
  const alinan = []
  for (const sart of [...sartlar, () => true]) {
    for (let i = 0; i < havuz.length && alinan.length < adet; i++) {
      if (sart(havuz[i])) alinan.push(...havuz.splice(i--, 1))
    }
    if (alinan.length === adet) break
  }
  return alinan
}

// --- 1. bankayı oku ------------------------------------------------------

const hamFermi = oku('fermi.json')
const hamMcq = oku('mcq.json')

// Peçete hesabı olan sorular önce gelsin: sonuç ekranının asıl içeriği o.
const fermiHavuz = [...hamFermi].sort((a, b) => {
  const pa = a.napkin || a._napkin_en ? 0 : 1
  const pb = b.napkin || b._napkin_en ? 0 : 1
  return pa - pb || a.id.localeCompare(b.id)
})
const mcqHavuz = [...hamMcq].sort((a, b) => a.id.localeCompare(b.id))

// --- 2. paketleri kur ----------------------------------------------------

const paketler = []
const kullanilan = new Set()

for (const tanim of PAKET_TANIMLARI) {
  const fermi = sec(fermiHavuz, PAKET_FERMI, [(s) => konuEslesiyor(s, tanim.konular)])
  const mcq = sec(mcqHavuz, PAKET_MCQ, [(s) => konuEslesiyor(s, tanim.konular)])

  if (fermi.length < PAKET_FERMI || mcq.length < PAKET_MCQ) {
    throw new Error(
      `${tanim.slug}: yeterli soru yok (${fermi.length} fermi, ${mcq.length} mcq)`,
    )
  }

  const secilenler = [...fermi, ...mcq]
  for (const s of secilenler) {
    if (kullanilan.has(s.id)) throw new Error(`${s.id} iki pakette birden`)
    kullanilan.add(s.id)
  }

  paketler.push({
    slug: tanim.slug,
    baslik: tanim.baslik,
    aciklama: tanim.aciklama,
    renk: tanim.renk,
    metin_rengi: tanim.metin_rengi,
    // Fermi soruları araya serpilir; paket üst üste yedi şıkla başlamasın.
    soru_ids: [
      fermi[0].id,
      mcq[0].id,
      mcq[1].id,
      fermi[1].id,
      mcq[2].id,
      mcq[3].id,
      mcq[4].id,
      fermi[2].id,
      mcq[5].id,
      mcq[6].id,
    ],
  })
}

// --- 3. takvimi kur ------------------------------------------------------

const takvim = []
let tarih = TAKVIM_BASLANGIC
let no = 1

while (fermiHavuz.length >= GUNLUK_FERMI && mcqHavuz.length >= GUNLUK_MCQ) {
  const gunun = [
    ...fermiHavuz.splice(0, GUNLUK_FERMI),
    ...mcqHavuz.splice(0, GUNLUK_MCQ),
  ]
  for (const s of gunun) {
    if (kullanilan.has(s.id)) throw new Error(`${s.id} takvimde tekrar ediyor`)
    kullanilan.add(s.id)
  }
  takvim.push({ tarih, no, soru_ids: gunun.map((s) => s.id) })
  tarih = gunEkle(tarih, 1)
  no++
}

// --- 4. yayına giren soruları yaz ---------------------------------------

const fermiCikti = hamFermi
  .filter((s) => kullanilan.has(s.id))
  .map((s) => ({ ...s, ...bandHesapla(s) }))
const mcqCikti = hamMcq.filter((s) => kullanilan.has(s.id))

for (const s of mcqCikti) {
  if (new Set(s.choices).size !== 4) throw new Error(`${s.id}: dört tekil şık yok`)
  if (s.correct_index < 0 || s.correct_index > 3) {
    throw new Error(`${s.id}: correct_index geçersiz`)
  }
}
for (const s of fermiCikti) {
  if (!(s.answer > 0)) throw new Error(`${s.id}: answer pozitif değil`)
}

yaz('fermi.json', fermiCikti)
yaz('mcq.json', mcqCikti)
yaz('packs.json', paketler)
yaz('calendar.json', takvim)

const cevirisiz = fermiCikti.filter((s) => !s.napkin && s._napkin_en).length
console.log(
  [
    `paket    ${paketler.length} x 10 soru`,
    `takvim   ${takvim.length} gün (${TAKVIM_BASLANGIC} -> ${takvim.at(-1).tarih})`,
    `fermi    ${fermiCikti.length}`,
    `mcq      ${mcqCikti.length}`,
    cevirisiz ? `uyarı    ${cevirisiz} fermi sorusunun peçetesi hâlâ İngilizce` : '',
  ]
    .filter(Boolean)
    .join('\n'),
)
