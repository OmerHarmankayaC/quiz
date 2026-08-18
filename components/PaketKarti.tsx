import Link from 'next/link';
import type { Paket } from '@/lib/game/types';
import { kaplamaRengi, paketRenkleri } from '@/lib/game/renk';

interface Props {
	paket: Paket;
	enIyi: number | null;
	yuklendi: boolean;
}

export function PaketKarti({ paket, enIyi, yuklendi }: Props) {
	const maksimum = paket.soru_ids.length * 100;
	const { zemin, metin } = paketRenkleri(paket);
	const kaplama = kaplamaRengi(zemin);
	// Astral karakterle (ör. emoji) baslayan basliklarda charAt(0) surrogate cifti bolerdi.
	const monogram = ([...paket.baslik.trim()][0] ?? '').toLocaleUpperCase('tr');

	return (
		<Link href={`/paket/${paket.slug}`} className="block">
			<div
				className="flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-xl p-3"
				style={{ background: zemin, color: metin }}
			>
				<div className="flex items-start justify-between">
					<span
						className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium"
						style={{ background: kaplama }}
						aria-hidden
					>
						{monogram}
					</span>
					<span
						className="rounded-full px-2 py-0.5 text-[10px]"
						style={{ background: kaplama }}
					>
						{paket.soru_ids.length} soru
					</span>
				</div>
				<span className="break-words text-lg font-medium leading-tight">{paket.baslik}</span>
			</div>
			{/* Kayit okunmadan once "oynanmadı" demek yanlis olabilir; satir yer tutar. */}
			<p className="mt-2 text-xs text-[var(--metin-soluk)]">
				{!yuklendi ? ' ' : enIyi === null ? 'oynanmadı' : `en iyi ${enIyi} / ${maksimum}`}
			</p>
		</Link>
	);
}
