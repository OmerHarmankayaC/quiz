import { PAKETLER } from '@/lib/game/bank';
import { PaketOyunu } from './PaketOyunu';

export function generateStaticParams() {
	return PAKETLER.map((p) => ({ slug: p.slug }));
}

export default async function PaketSayfa({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	return <PaketOyunu slug={slug} />;
}
