'use client';

import { useState } from 'react';
import { SLIDER_MAX, sliderDegerine, kademeye, tahminiYuvarla } from '@/lib/game/scoring';
import { sayiCozumle, sayiMetni } from '@/lib/game/format';

interface Props {
	birim: string;
	deger: number;
	onDegisti: (deger: number) => void;
}

export function TahminSlider({ birim, deger, onDegisti }: Props) {
	const [yaziyor, setYaziyor] = useState(false);
	const [taslak, setTaslak] = useState('');

	function kademeDegisti(kademe: number) {
		onDegisti(tahminiYuvarla(sliderDegerine(kademe)));
	}

	function yaziyiBitir() {
		// Cozulemeyen metinde onceki tahmin oldugu gibi kalir - kutuyu acip kapatmak
		// ya da yanlis bir sey yazmak degeri asla baska bir sayiya cevirmez.
		const sayi = sayiCozumle(taslak);
		if (sayi !== null) onDegisti(tahminiYuvarla(sayi));
		setYaziyor(false);
	}

	return (
		<div>
			{/* Kutu acikken kaynak dogru taslak metnidir: oyuncu ne yazdiysa onu gorur,
			    sayiMetni ozetine ancak kutu kapaninca donulur. */}
			{yaziyor ? (
				<input
					autoFocus
					inputMode="numeric"
					value={taslak}
					onChange={(e) => setTaslak(e.target.value)}
					onBlur={yaziyiBitir}
					onKeyDown={(e) => e.key === 'Enter' && yaziyiBitir()}
					className="w-full bg-transparent text-4xl font-medium outline-none"
					aria-label="Tahmininizi yazın"
				/>
			) : (
				<button
					type="button"
					onClick={() => {
						// Turkce gosterim: kutuda gorulen metin ile sayiCozumle'nin bekledigi
						// bicim ayni olmali, yoksa acip kapatmak degeri kaydirir.
						setTaslak(String(deger).replace('.', ','));
						setYaziyor(true);
					}}
					className="text-left text-4xl font-medium"
				>
					{sayiMetni(deger)}
				</button>
			)}

			<p className="mt-1 text-sm text-[var(--metin-soluk)]">{birim}</p>

			<input
				type="range"
				min={0}
				max={SLIDER_MAX}
				step={1}
				value={kademeye(deger)}
				onChange={(e) => kademeDegisti(Number(e.target.value))}
				className="mt-6 w-full"
				aria-label="Tahmin ölçeği"
			/>

			<div className="mt-1 flex justify-between text-xs text-[var(--metin-soluk)]">
				<span>0,1</span>
				<span>10¹⁷</span>
			</div>
		</div>
	);
}
