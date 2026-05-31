import type { Metadata } from 'next';
import { Oswald, Newsreader } from 'next/font/google';

import './globals.css';

const oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' });
const newsreader = Newsreader({ subsets: ['latin'], variable: '--font-newsreader' });

export const metadata: Metadata = {
  title: 'ATLAS PORTAL | REVEL',
  description: 'Authenticated role-based wedding operations portal.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${oswald.variable} ${newsreader.variable}`}>{children}</body>
    </html>
  );
}
