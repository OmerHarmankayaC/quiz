import Link from 'next/link';

interface Props {
	no: number | null;
	tarihMetni: string;
	streak: number;
	oynandi: boolean;
}

export function GunlukKapak({ no, tarihMetni, streak, oynandi }: Props) {
	if (no === null) {
		return (
			<div className="rounded-xl bg-[var(--yuzey)] p-5">
				<p className="text-sm text-[var(--metin-ikincil)]">
					Bugün için bulmaca yok. Aşağıdaki paketlerden birini dene.
				</p>
			</div>
		);
	}

	return (
		<div className="flex items-end justify-between gap-4 rounded-xl bg-[var(--yuzey)] p-5">
			<div>
				<p className="text-xs tracking-wide text-[var(--metin-soluk)]">
					bugünün bulmacası · {tarihMetni}
				</p>
				<p className="mt-2 text-3xl font-medium">No. {no}</p>
				<p className="mt-1 text-sm text-[var(--metin-ikincil)]">
					3 soru{streak > 0 && ` · seri ${streak} gün`}
				</p>
			</div>
			<Link
				href="/gunluk"
				className="whitespace-nowrap rounded-lg bg-[var(--metin)] px-5 py-2.5 font-medium text-[var(--zemin)]"
			>
				{oynandi ? 'Tekrar oyna' : 'Oyna'}
			</Link>
		</div>
	);
}
