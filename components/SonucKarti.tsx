import type { Soru } from '@/lib/game/types';
import { oran, oranMetni } from '@/lib/game/scoring';
import { sayiMetni } from '@/lib/game/format';

interface Props {
	soru: Soru;
	cevap: number;
	puan: number;
}

export function SonucKarti({ soru, cevap, puan }: Props) {
	return (
		<div className="rounded-xl bg-[var(--yuzey)] p-4">
			<div className="flex items-baseline gap-3">
				<span className="text-3xl font-medium">{puan}</span>
				<span className="text-sm text-[var(--metin-ikincil)]">
					puan
					{soru.mode === 'fermi' && ` · ${oranMetni(oran(cevap, soru.answer))} sapma`}
				</span>
			</div>

			{soru.mode === 'fermi' ? (
				<>
					<p className="mt-3 text-sm text-[var(--metin-ikincil)]">
						Doğru cevap {sayiMetni(soru.answer)} {soru.unit} · senin tahminin {sayiMetni(cevap)}
					</p>
					{soru.napkin && (
						<div className="mt-4 rounded-lg border border-[var(--kenar)] p-3">
							<p className="text-sm font-medium">Peçete hesabı</p>
							<p className="mt-1 text-sm text-[var(--metin-ikincil)]">{soru.napkin.lead}</p>
							<dl className="mt-3">
								{soru.napkin.rows.map(([etiket, deger]) => (
									<div key={etiket} className="flex justify-between py-1 text-sm">
										<dt className="text-[var(--metin-ikincil)]">{etiket}</dt>
										<dd>{deger}</dd>
									</div>
								))}
							</dl>
						</div>
					)}
				</>
			) : (
				<>
					<p className="mt-3 text-sm text-[var(--metin-ikincil)]">
						Doğru cevap: {soru.choices[soru.correct_index]}
					</p>
					<p className="mt-2 text-sm text-[var(--metin-ikincil)]">{soru.explanation}</p>
				</>
			)}

			<p className="mt-4 text-xs text-[var(--metin-soluk)]">Kaynak: {soru.source}</p>
		</div>
	);
}
