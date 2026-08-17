/** Kaç sorudan kaçıncısındayız. Bölmeli çubuk, soru sayısı kadar parça. */
export function Ilerleme({
  toplam,
  bulunulan,
  bitenler,
}: {
  toplam: number
  bulunulan: number
  bitenler: number
}) {
  return (
    <div
      className="flex gap-1"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={toplam}
      aria-valuenow={bitenler}
      aria-label={`${toplam} sorudan ${bulunulan + 1}. soru`}
    >
      {Array.from({ length: toplam }, (_, i) => (
        <span
          key={i}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
            i < bitenler
              ? 'bg-metin'
              : i === bulunulan
                ? 'bg-solgun'
                : 'bg-cizgi'
          }`}
        />
      ))}
    </div>
  )
}
