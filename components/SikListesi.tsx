'use client';

interface Props {
	siklar: readonly string[];
	secim: number | null;
	onSecti: (index: number) => void;
}

export function SikListesi({ siklar, secim, onSecti }: Props) {
	return (
		<div className="flex flex-col gap-2">
			{siklar.map((sik, i) => (
				<button
					key={sik}
					type="button"
					onClick={() => onSecti(i)}
					aria-pressed={secim === i}
					className={
						'rounded-lg border px-4 py-3 text-left text-base transition ' +
						(secim === i
							? 'border-[var(--metin)] bg-[var(--yuzey)]'
							: 'border-[var(--kenar)] hover:border-[var(--metin-soluk)]')
					}
				>
					{sik}
				</button>
			))}
		</div>
	);
}
