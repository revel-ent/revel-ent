import type { Metadata } from 'next';
import { Oswald, Newsreader } from 'next/font/google';

import './globals.css';

const oswald = Oswald({ subsets: ['latin'] });
const newsreader = Newsreader({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'REVEL Portal App',
  description: 'Authenticated role-based wedding operations portal.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${oswald.className} ${newsreader.className}`}>{children}</body>
    </html>
  );
}
