/**
 * Banka şemasının tek doğruluk kaynağı.
 * `data/bank/*.json` bu tiplere birebir uyar; başka hiçbir yerde soru şeması tanımlanmaz.
 */

export type Zorluk = 1 | 2 | 3

/** Peçete hesabının bir satırı: ["Etiket", "Değer"] */
export type NapkinSatiri = [string, string]

export type Napkin = {
  type: string
  lead: string
  rows: NapkinSatiri[]
}

type OrtakAlanlar = {
  id: string
  prompt: string
  topics: string[]
  difficulty: Zorluk
  source: string
  origin: string
  verified_at?: string
}

export type FermiSoru = OrtakAlanlar & {
  mode: 'fermi'
  answer: number
  unit: string
  /** Cevaba giden hesap zinciri. TR alan yoksa banka İngilizce yedeği taşır. */
  math?: NapkinSatiri[]
  napkin?: Napkin
  _math_en?: NapkinSatiri[]
  _napkin_en?: Napkin
  /** Kaynak birimi metrik sisteme çevrildiyse izi burada durur. */
  donusum?: string
}

export type McqSoru = OrtakAlanlar & {
  mode: 'mcq'
  choices: string[]
  correct_index: number
  explanation: string
  kaynak_id?: string
  kaynak_baslik?: string
}

export type Soru = FermiSoru | McqSoru

export type Paket = {
  slug: string
  baslik: string
  aciklama: string
  renk: string
  metin_rengi: string
  soru_ids: string[]
}

export type TakvimGunu = {
  tarih: string
  no: number
  soru_ids: string[]
}

/** Oyuncunun tek bir soruya verdiği yanıt. */
export type Yanit =
  | { mode: 'fermi'; tahmin: number }
  | { mode: 'mcq'; secim: number }

/** Bir sorunun oynanmış hali: soru + yanıt + puan. */
export type SoruSonucu = {
  soru: Soru
  yanit: Yanit
  puan: number
  /** Yalnızca fermi: max/min oranı. MCQ'da tanımsız. */
  oran?: number
}

export type OyunSonucu = {
  /** 'gunluk' ya da paket slug'ı. */
  kaynak: string
  baslik: string
  /** Günlük bulmacada takvim numarası, pakette yok. */
  no?: number
  tarih: string
  sonuclar: SoruSonucu[]
  toplam: number
  maksimum: number
}
