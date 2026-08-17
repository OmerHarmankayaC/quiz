'use client';

import { useState } from 'react';
import { SLIDER_MAX, sliderDegerine, kademeye } from '@/lib/game/scoring';
import { sayiMetni } from '@/lib/game/format';

interface Props {
	birim: string;
	deger: number;
	onDegisti: (deger: number) => void;
}

export function TahminSlider({ birim, deger, onDegisti }: Props) {
	const [yaziyor, setYaziyor] = useState(false);
	const [taslak, setTaslak] = useState('');

	function kademeDegisti(kademe: number) {
		onDegisti(Math.round(sliderDegerine(kademe)));
	}

	function yaziyiBitir() {
		const sayi = Number(taslak.replace(/\./g, '').replace(',', '.'));
		if (Number.isFinite(sayi) && sayi > 0) onDegisti(Math.round(sayi));
		setYaziyor(false);
	}

	return (
		<div>
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
						setTaslak(String(deger));
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
