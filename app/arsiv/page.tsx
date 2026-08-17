'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TAKVIM } from '@/lib/game/bank';
import { bugununTarihi } from '@/lib/game/daily';
import { kaydiOku, BOS_KAYIT, type OyunKaydi } from '@/lib/game/storage';

export default function ArsivSayfa() {
	const [kayit, setKayit] = useState<OyunKaydi>(BOS_KAYIT);
	const [bugun, setBugun] = useState('');
	const [yuklendi, setYuklendi] = useState(false);

	useEffect(() => {
		setKayit(kaydiOku());
		setBugun(bugununTarihi());
		setYuklendi(true);
	}, []);

	const gecmis = TAKVIM.filter((g) => bugun && g.tarih <= bugun).reverse();

	return (
		<main className="mx-auto max-w-xl p-5">
			<h1 className="text-lg font-medium">Arşiv</h1>

			{/* Bugunun tarihi belirlenmeden liste bos gorunur; "henuz gecmis bulmaca yok"
			    demek yerine sessiz bir yer tutucu satir birakiyoruz. */}
			{!yuklendi ? (
				<p className="mt-4 text-sm text-[var(--metin-soluk)]" aria-hidden>
					{' '}
				</p>
			) : gecmis.length === 0 ? (
				<p className="mt-4 text-sm text-[var(--metin-ikincil)]">Henüz geçmiş bulmaca yok.</p>
			) : (
				<ul className="mt-4 flex flex-col">
					{gecmis.map((gun) => (
						<li
							key={gun.tarih}
							className="flex items-center justify-between border-b border-[var(--kenar)] py-3"
						>
							<span>No. {gun.no}</span>
							<span className="text-sm text-[var(--metin-ikincil)]">
								{gun.tarih in kayit.gunluk
									? `${kayit.gunluk[gun.tarih]} / ${gun.soru_ids.length * 100}`
									: 'oynanmadı'}
							</span>
						</li>
					))}
				</ul>
			)}

			<nav className="mt-6 text-sm text-[var(--metin-soluk)]">
				<Link href="/">Ana ekran</Link>
			</nav>
		</main>
	);
}
