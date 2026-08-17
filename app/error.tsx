'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Hata({ error, reset }: { error: Error; reset: () => void }) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="mx-auto max-w-xl p-5">
			<h1 className="text-lg font-medium">Bir şeyler ters gitti</h1>
			<p className="mt-3 text-sm text-[var(--metin-ikincil)]">
				Bu ekran yüklenemedi. Tekrar deneyebilir ya da ana ekrana dönebilirsin.
			</p>

			<div className="mt-6 flex items-center gap-4">
				<button
					type="button"
					onClick={reset}
					className="rounded-lg bg-[var(--metin)] px-6 py-3 font-medium text-[var(--zemin)]"
				>
					Tekrar dene
				</button>
				<Link href="/" className="text-sm text-[var(--metin-soluk)] underline">
					Ana ekran
				</Link>
			</div>
		</main>
	);
}
