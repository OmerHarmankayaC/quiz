'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SORU_DIZINI } from '@/lib/game/bank';
import { toplamPuan } from '@/lib/game/scoring';
import { paylasimMetni } from '@/lib/game/paylasim';
import { sonucuAl, type SaklananSonuc } from '@/lib/game/sonuc-aktarim';
import { SonucKarti } from '@/components/SonucKarti';
import type { Soru } from '@/lib/game/types';

export default function SonucSayfa() {
	const [sonuc, setSonuc] = useState<SaklananSonuc | null>(null);
	const [kopyalandi, setKopyalandi] = useState(false);
	const [panoHatasi, setPanoHatasi] = useState(false);

	useEffect(() => setSonuc(sonucuAl()), []);

	if (!sonuc) {
		return (
			<main className="mx-auto max-w-xl p-5">
				<p>Gösterilecek sonuç yok.</p>
				<Link href="/" className="mt-4 inline-block underline">
					Ana ekrana dön
				</Link>
			</main>
		);
	}

	// soruIdler bankada artik bulunmayan bir id icerebilir (surum degisikligi) ve
	// cevaplar/puanlar dizileri soruIdler'dan kisa olabilir (bozuk kayit). Once
	// gecerli indeksleri bul, sonra sorular/cevaplar/puanlar'i AYNI indekslerle
	// birlikte filtrele - boylece bir soru atlansa bile sonraki cevaplar kaymaz.
	const gecerliIndeksler = sonuc.soruIdler
		.map((id, i) => (SORU_DIZINI.has(id) ? i : -1))
		.filter((i) => i !== -1);

	const sorular = gecerliIndeksler.map((i) => SORU_DIZINI.get(sonuc.soruIdler[i]) as Soru);
	const gecerliSonuc: SaklananSonuc = {
		...sonuc,
		soruIdler: gecerliIndeksler.map((i) => sonuc.soruIdler[i]),
		cevaplar: gecerliIndeksler.map((i) => sonuc.cevaplar[i] ?? 0),
		puanlar: gecerliIndeksler.map((i) => sonuc.puanlar[i] ?? 0)
	};

	const paylasimTexti = paylasimMetni(gecerliSonuc, sorular);

	async function kopyala() {
		try {
			await navigator.clipboard.writeText(paylasimTexti);
			setKopyalandi(true);
			setPanoHatasi(false);
		} catch {
			// Guvenli olmayan baglamda navigator.clipboard tanimsizdir ya da izin
			// reddedilebilir - sessizce yutmak yerine metni elle kopyalanabilir hale getir.
			setKopyalandi(false);
			setPanoHatasi(true);
		}
	}

	return (
		<main className="mx-auto max-w-xl p-5">
			<p className="text-xs text-[var(--metin-soluk)]">{sonuc.baslik}</p>
			<h1 className="mt-2 text-4xl font-medium">
				{toplamPuan(gecerliSonuc.puanlar)}
				<span className="text-lg text-[var(--metin-ikincil)]"> / {sorular.length * 100}</span>
			</h1>

			<div className="mt-6 flex flex-col gap-3">
				{sorular.map((soru, i) => (
					<div key={soru.id}>
						<p className="mb-2 text-sm text-[var(--metin-ikincil)]">{soru.prompt}</p>
						<SonucKarti soru={soru} cevap={gecerliSonuc.cevaplar[i]} puan={gecerliSonuc.puanlar[i]} />
					</div>
				))}
			</div>

			<button
				type="button"
				onClick={kopyala}
				className="mt-6 rounded-lg bg-[var(--metin)] px-6 py-3 font-medium text-[var(--zemin)]"
			>
				{kopyalandi ? 'Kopyalandı' : 'Sonucu kopyala'}
			</button>

			{panoHatasi && (
				<div className="mt-3">
					<p className="text-sm text-[var(--metin-ikincil)]">
						Panoya erişilemedi, metni elle kopyalayabilirsin.
					</p>
					<textarea
						readOnly
						value={paylasimTexti}
						onFocus={(e) => e.currentTarget.select()}
						className="mt-2 w-full rounded-lg border border-[var(--kenar)] bg-[var(--yuzey)] p-3 text-sm"
						rows={sorular.length + 3}
					/>
				</div>
			)}

			<nav className="mt-6 text-sm text-[var(--metin-soluk)]">
				<Link href="/">Ana ekran</Link>
			</nav>
		</main>
	);
}
