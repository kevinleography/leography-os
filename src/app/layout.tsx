import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LEOGRAPHY OS',
  description: "Système d'exploitation agence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} macos-bg min-h-screen text-slate-900 font-sans selection:bg-blue-200`}>
        {children}
      </body>
    </html>
  );
}
