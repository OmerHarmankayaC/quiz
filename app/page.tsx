'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PAKETLER, TAKVIM } from '@/lib/game/bank';
import { bugununTarihi, gunuBul } from '@/lib/game/daily';
import { kaydiOku, gecerliStreak, BOS_KAYIT, type OyunKaydi } from '@/lib/game/storage';
import { PaketKarti } from '@/components/PaketKarti';
import { GunlukKapak } from '@/components/GunlukKapak';

export default function AnaSayfa() {
	const [kayit, setKayit] = useState<OyunKaydi>(BOS_KAYIT);
	const [tarih, setTarih] = useState('');
	const [yuklendi, setYuklendi] = useState(false);

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

	return (
		<main className="mx-auto max-w-3xl p-5">
			<header className="mb-6 flex items-center justify-between">
				<span className="text-lg font-medium">Kaç?</span>
				{streak > 0 && (
					<span className="rounded-full bg-[#fac775] px-3 py-1 text-xs text-[#0b0b0b]">
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

			<div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
				{PAKETLER.map((p) => (
					<PaketKarti
						key={p.slug}
						paket={p}
						enIyi={kayit.paketler[p.slug]?.enIyi ?? null}
						yuklendi={yuklendi}
					/>
				))}
			</div>

			<nav className="mt-8 text-sm text-[var(--metin-soluk)]">
				<Link href="/arsiv">Arşiv</Link>
			</nav>
		</main>
	);
}
