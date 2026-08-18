import Link from 'next/link';

interface Props {
	no: number | null;
	tarihMetni: string;
	streak: number;
	oynandi: boolean;
	yuklendi: boolean;
}

export function GunlukKapak({ no, tarihMetni, streak, oynandi, yuklendi }: Props) {
	// Kayit okunmadan once "bugun icin bulmaca yok" demek yaniltici olur: bilmiyoruz.
	// Ayni cerceve sessiz bir yer tutucuyla cizilir, boylece yerlesim ziplamaz.
	if (!yuklendi) {
		return (
			<div
				className="flex items-end justify-between gap-4 rounded-xl border border-[var(--kenar)] p-5"
				aria-hidden
			>
				<div className="text-[var(--metin-soluk)]">
					<p className="text-xs tracking-wide">bugünün bulmacası</p>
					<p className="mt-2 text-3xl font-medium opacity-40">—</p>
					<p className="mt-1 text-sm">{' '}</p>
				</div>
				<span className="whitespace-nowrap rounded-full border border-[var(--kenar)] px-5 py-2.5 font-medium text-transparent">
					Oyna
				</span>
			</div>
		);
	}

	if (no === null) {
		return (
			<div className="rounded-xl border border-[var(--kenar)] p-5">
				<p className="text-sm text-[var(--metin-ikincil)]">
					Bugün için bulmaca yok. Aşağıdaki paketlerden birini dene.
				</p>
			</div>
		);
	}

	return (
		<div className="flex items-end justify-between gap-4 rounded-xl border border-[var(--kenar)] p-5">
			<div>
				<p className="text-xs tracking-wide text-[var(--metin-soluk)]">
					bugünün bulmacası · {tarihMetni}
				</p>
				<p className="mt-2 text-2xl font-medium">No. {no}</p>
				<p className="mt-1 text-sm text-[var(--metin-ikincil)]">
					3 soru{streak > 0 && ` · seri ${streak} gün`}
				</p>
			</div>
			<Link
				href="/gunluk"
				className="whitespace-nowrap rounded-full bg-[var(--metin)] px-5 py-2.5 text-sm font-medium text-[var(--zemin)]"
			>
				{oynandi ? 'Tekrar oyna' : 'Oyna'}
			</Link>
		</div>
	);
}
