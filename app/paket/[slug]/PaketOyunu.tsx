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
	// generateStaticParams yalnizca gercek slug'lari uretir ve export'ta catch-all yok:
	// bilinmeyen slug 404.html'e duser, buraya hic gelmez. Tip daraltmasi icin firlatiyoruz,
	// beklenmedik bir durumda app/error.tsx devreye girer.
	if (!paket) throw new Error(`bilinmeyen paket: ${slug}`);

	// Bir kez daralt: hoist edilen bitti() icinde tekrar null kontrolu gerekmesin.
	const { baslik, soru_ids } = paket;
	const sorular = sorulariGetir(soru_ids);

	function bitti(sonuclar: OyunSonucu[]) {
		const puanlar = sonuclar.map((s) => s.puan);
		kaydiYaz(
			paketiKaydet(kaydiOku(), slug, toplamPuan(puanlar), new Date().toISOString())
		);
		sonucuSakla({
			baslik: `Kaç? · ${baslik}`,
			soruIdler: sonuclar.map((s) => s.soruId),
			cevaplar: sonuclar.map((s) => s.cevap),
			puanlar
		});
		router.push('/sonuc');
	}

	return <SoruEkrani sorular={sorular} baslik={baslik} onBitti={bitti} />;
}
