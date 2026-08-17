import Link from 'next/link';
import type { Paket } from '@/lib/game/types';

interface Props {
	paket: Paket;
	enIyi: number | null;
}

export function PaketKarti({ paket, enIyi }: Props) {
	const maksimum = paket.soru_ids.length * 100;

	return (
		<Link href={`/paket/${paket.slug}`} className="block">
			<div
				className="flex h-40 flex-col justify-between rounded-xl p-4"
				style={{ background: paket.renk, color: paket.metin_rengi }}
			>
				<span className="text-xs opacity-70">{paket.soru_ids.length} soru</span>
				<span className="text-2xl font-medium leading-tight">{paket.baslik}</span>
			</div>
			<p className="mt-2 text-xs text-[var(--metin-soluk)]">
				{enIyi === null ? 'oynanmadı' : `en iyi ${enIyi} / ${maksimum}`}
			</p>
		</Link>
	);
}
