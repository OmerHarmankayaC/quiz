import { GunlukKapak } from '@/components/gunluk-kapak'
import { PaketIzgarasi } from '@/components/paket-izgarasi'
import { UstCubuk } from '@/components/ust-cubuk'

export default function AnaEkran() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-20 sm:px-6">
      <UstCubuk />
      <main className="mt-4 space-y-12">
        <GunlukKapak />
        <PaketIzgarasi />
      </main>
    </div>
  )
}
