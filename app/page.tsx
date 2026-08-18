'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { PAKETLER, TAKVIM } from '@/lib/game/bank';
import { bugununTarihi, gunuBul } from '@/lib/game/daily';
import { kaydiOku, gecerliStreak, BOS_KAYIT, type OyunKaydi } from '@/lib/game/storage';
import { PaketKarti } from '@/components/PaketKarti';
import { GunlukKapak } from '@/components/GunlukKapak';

type Suzgec = 'tumu' | 'oynanmadi';

export default function AnaSayfa() {
	const [kayit, setKayit] = useState<OyunKaydi>(BOS_KAYIT);
	const [tarih, setTarih] = useState('');
	const [yuklendi, setYuklendi] = useState(false);
	const [suzgec, setSuzgec] = useState<Suzgec>('tumu');

	useEffect(() => {
		setKayit(kaydiOku());
		setTarih(bugununTarihi());
		setYuklendi(true);
	}, []);

	const gun = tarih ? gunuBul(TAKVIM, tarih) : null;
	const streak = tarih ? gecerliStreak(kayit, tarih) : 0;
	const tarihMetni = tarih
		? new Date(tarih + 'T00:00:00Z').toLocaleDateString('tr-TR', {
				day: 'numeric',
				month: 'long',
				timeZone: 'UTC'
			})
		: '';

	// Kayit okunmadan hangi paketin oynandigini bilmiyoruz; suzgec o ana kadar uygulanmaz.
	const gorunenPaketler = useMemo(
		() =>
			!yuklendi || suzgec === 'tumu'
				? PAKETLER
				: PAKETLER.filter((p) => kayit.paketler[p.slug] === undefined),
		[yuklendi, suzgec, kayit]
	);

	return (
		<main className="mx-auto max-w-3xl p-5">
			<header className="mb-6 flex items-center justify-between">
				<span className="text-lg font-medium">Kaç?</span>
				{streak > 0 && (
					<span className="rounded-full border border-[var(--kenar)] px-3 py-1 text-xs text-[var(--metin-ikincil)]">
						seri {streak}
					</span>
				)}
			</header>

			<GunlukKapak
				no={gun?.no ?? null}
				tarihMetni={tarihMetni}
				streak={streak}
				oynandi={tarih in kayit.gunluk}
				yuklendi={yuklendi}
			/>

			<div className="mt-6 flex gap-2">
				{([
					['tumu', 'Tümü'],
					['oynanmadi', 'Oynanmadı']
				] as const).map(([deger, etiket]) => (
					<button
						key={deger}
						type="button"
						onClick={() => setSuzgec(deger)}
						aria-pressed={suzgec === deger}
						className={
							'rounded-full px-3 py-1 text-xs transition ' +
							(suzgec === deger
								? 'bg-[var(--metin)] text-[var(--zemin)]'
								: 'border border-[var(--kenar)] text-[var(--metin-ikincil)]')
						}
					>
						{etiket}
					</button>
				))}
			</div>

			{gorunenPaketler.length === 0 ? (
				<p className="mt-6 text-sm text-[var(--metin-ikincil)]">
					Bütün paketleri oynamışsın.
				</p>
			) : (
				<div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
					{gorunenPaketler.map((p) => (
						<PaketKarti
							key={p.slug}
							paket={p}
							enIyi={kayit.paketler[p.slug]?.enIyi ?? null}
							yuklendi={yuklendi}
						/>
					))}
				</div>
			)}

			<nav className="mt-8 text-sm text-[var(--metin-soluk)]">
				<Link href="/arsiv">Arşiv</Link>
			</nav>
		</main>
	);
}
