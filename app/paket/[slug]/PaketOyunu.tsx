'use client';

import { useRouter } from 'next/navigation';
import { paketiGetir, sorulariGetir } from '@/lib/game/bank';
import { toplamPuan } from '@/lib/game/scoring';
import { kaydiOku, kaydiYaz, paketiKaydet } from '@/lib/game/storage';
import { sonucuSakla } from '@/lib/game/sonuc-aktarim';
import { SoruEkrani } from '@/components/SoruEkrani';
import type { OyunSonucu } from '@/lib/game/akis';

export function PaketOyunu({ slug }: { slug: string }) {
	const router = useRouter();
	const paket = paketiGetir(slug);

	if (!paket) {
		return (
			<main className="mx-auto max-w-xl p-5">
				<p>Bu paket bulunamadı.</p>
				<a href="/" className="mt-4 inline-block underline">
					Ana ekrana dön
				</a>
			</main>
		);
	}

	const sorular = sorulariGetir(paket.soru_ids);

	function bitti(sonuclar: OyunSonucu[]) {
		const puanlar = sonuclar.map((s) => s.puan);
		kaydiYaz(
			paketiKaydet(kaydiOku(), slug, toplamPuan(puanlar), new Date().toISOString())
		);
		sonucuSakla({
			baslik: `Kaç? · ${paket!.baslik}`,
			kaynak: 'paket',
			slug,
			soruIdler: sonuclar.map((s) => s.soruId),
			cevaplar: sonuclar.map((s) => s.cevap),
			puanlar
		});
		router.push('/sonuc');
	}

	return <SoruEkrani sorular={sorular} baslik={paket.baslik} onBitti={bitti} />;
}
