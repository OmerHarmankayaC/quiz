/** Ekranın nihai şeklini taklit eden iskelet. Dönen çember yok. */
export function Yukleniyor() {
  return (
    <main
      className="mx-auto w-full max-w-2xl animate-pulse px-4 pb-8 pt-5 sm:px-6"
      aria-busy="true"
      aria-label="Yükleniyor"
    >
      <div className="mb-8 space-y-4">
        <div className="h-5 w-32 rounded bg-yuzey" />
        <div className="h-[3px] w-full rounded bg-yuzey" />
      </div>
      <div className="space-y-3">
        <div className="h-8 w-full rounded bg-yuzey" />
        <div className="h-8 w-3/4 rounded bg-yuzey" />
      </div>
      <div className="mt-10 space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-full rounded-kontrol bg-yuzey" />
        ))}
      </div>
    </main>
  )
}
