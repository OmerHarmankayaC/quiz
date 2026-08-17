import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Kaç?',
	description: 'Tahmin et, ne kadar yaklaştığını gör.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="tr">
			<body className="min-h-screen antialiased">{children}</body>
		</html>
	);
}
