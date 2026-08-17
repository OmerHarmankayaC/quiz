import { notFound } from 'next/navigation'
import { OyunEkrani } from '@/components/oyun-ekrani'
import { PAKETLER, paketiBul, sorulariTopla } from '@/lib/bank'

export function generateStaticParams() {
  return PAKETLER.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const paket = paketiBul(slug)
  return { title: paket ? `${paket.baslik} · Kaç?` : 'Kaç?' }
}

export default async function PaketEkrani({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const paket = paketiBul(slug)
  if (!paket) notFound()

  return (
    <OyunEkrani
      kaynak={paket.slug}
      baslik={paket.baslik}
      ustBaslik="Paketler"
      sorular={sorulariTopla(paket.soru_ids)}
    />
  )
}
