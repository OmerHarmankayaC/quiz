'use client';

import { useState } from 'react';
import type { Soru } from '@/lib/game/types';
import { soruPuani } from '@/lib/game/scoring';
import { sonrakiDurum, type OyunSonucu } from '@/lib/game/akis';
import { TahminSlider } from './TahminSlider';
import { SikListesi } from './SikListesi';
import { SonucKarti } from './SonucKarti';

interface Props {
	sorular: Soru[];
	baslik: string;
	onBitti: (sonuclar: OyunSonucu[]) => void;
}

export function SoruEkrani({ sorular, baslik, onBitti }: Props) {
	const [sira, setSira] = useState(0);
	const [tahmin, setTahmin] = useState(1000);
	const [secim, setSecim] = useState<number | null>(null);
	const [kilitli, setKilitli] = useState(false);
	const [hata, setHata] = useState('');
	const [sonuclar, setSonuclar] = useState<OyunSonucu[]>([]);

	const soru = sorular[sira];
	const cevap = soru.mode === 'fermi' ? tahmin : (secim ?? -1);
	const puan = kilitli ? soruPuani(soru, cevap) : 0;

	function kilitle() {
		if (soru.mode === 'mcq' && secim === null) {
			setHata('Önce bir şık seç');
			return;
		}
		setHata('');
		setKilitli(true);
		setSonuclar([...sonuclar, { soruId: soru.id, cevap, puan: soruPuani(soru, cevap) }]);
	}

	function devam() {
		if (sonrakiDurum(sira, sorular.length) === 'bitti') {
			onBitti(sonuclar);
			return;
		}
		setSira(sira + 1);
		setTahmin(1000);
		setSecim(null);
		setKilitli(false);
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-xl flex-col p-5">
			<p className="text-xs text-[var(--metin-soluk)]">
				{baslik} · soru {sira + 1} / {sorular.length}
			</p>

			<h1 className="mt-2 text-xl font-medium leading-snug">{soru.prompt}</h1>

			<div className="mt-8 flex-1">
				{kilitli ? (
					<SonucKarti soru={soru} cevap={cevap} puan={puan} />
				) : soru.mode === 'fermi' ? (
					<TahminSlider birim={soru.unit} deger={tahmin} onDegisti={setTahmin} />
				) : (
					<SikListesi siklar={soru.choices} secim={secim} onSecti={setSecim} />
				)}
			</div>

			{hata && <p className="mt-3 text-sm text-red-400">{hata}</p>}

			<button
				type="button"
				onClick={kilitli ? devam : kilitle}
				className="mt-6 rounded-lg bg-[var(--metin)] px-6 py-3 font-medium text-[var(--zemin)]"
			>
				{kilitli ? (sonrakiDurum(sira, sorular.length) === 'bitti' ? 'Sonuçlar' : 'Devam') : 'Kilitle'}
			</button>
		</main>
	);
}
