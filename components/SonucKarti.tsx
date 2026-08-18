import type { Soru } from '@/lib/game/types';
import { oran, oranMetni } from '@/lib/game/scoring';
import { sayiMetni } from '@/lib/game/format';
import { hesabiSec } from '@/lib/game/hesap';

interface Props {
	soru: Soru;
	cevap: number;
	puan: number;
}

export function SonucKarti({ soru, cevap, puan }: Props) {
	const hesap = hesabiSec(soru);

	return (
		<div className="rounded-xl border border-[var(--kenar)] p-4">
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
					{hesap && (
						<div className="mt-4 rounded-lg bg-[var(--yuzey)] p-3">
							<p className="text-sm font-medium">{hesap.baslik}</p>
							{hesap.lead && (
								<p className="mt-1 text-sm text-[var(--metin-ikincil)]">{hesap.lead}</p>
							)}
							<dl className="mt-3">
								{hesap.rows.map(([etiket, deger], i) => (
									<div key={i} className="flex justify-between py-1 text-sm">
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
