'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TAKVIM, sorulariGetir } from '@/lib/game/bank';
import { bugununTarihi, gunuBul } from '@/lib/game/daily';
import { toplamPuan } from '@/lib/game/scoring';
import { kaydiOku, kaydiYaz, gunuKaydet } from '@/lib/game/storage';
import { sonucuSakla } from '@/lib/game/sonuc-aktarim';
import { SoruEkrani } from '@/components/SoruEkrani';
import type { Soru } from '@/lib/game/types';
import type { OyunSonucu } from '@/lib/game/akis';

export default function GunlukSayfa() {
	const router = useRouter();
	const [sorular, setSorular] = useState<Soru[] | null>(null);
	const [tarih, setTarih] = useState('');
	const [no, setNo] = useState(0);

	useEffect(() => {
		const t = bugununTarihi();
		const gun = gunuBul(TAKVIM, t);
		setTarih(t);
		setNo(gun?.no ?? 0);
		setSorular(gun ? sorulariGetir(gun.soru_ids) : []);
	}, []);

	if (sorular === null) return <main className="p-5">Yükleniyor…</main>;

	if (sorular.length === 0) {
		return (
			<main className="mx-auto max-w-xl p-5">
				<p>Bugün için bulmaca yok.</p>
				<a href="/" className="mt-4 inline-block underline">
					Ana ekrana dön
				</a>
			</main>
		);
	}

	function bitti(sonuclar: OyunSonucu[]) {
		const puanlar = sonuclar.map((s) => s.puan);
		kaydiYaz(gunuKaydet(kaydiOku(), tarih, toplamPuan(puanlar)));
		sonucuSakla({
			baslik: `Kaç? · No. ${no}`,
			kaynak: 'gunluk',
			slug: tarih,
			soruIdler: sonuclar.map((s) => s.soruId),
			cevaplar: sonuclar.map((s) => s.cevap),
			puanlar
		});
		router.push('/sonuc');
	}

	return <SoruEkrani sorular={sorular} baslik={`No. ${no}`} onBitti={bitti} />;
}
