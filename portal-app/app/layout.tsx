import type { Metadata } from 'next';
import { DM_Sans, Cormorant_Garamond } from 'next/font/google';

import './globals.css';

const dm_sans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Atlas — The Intelligence Layer for Events',
  description:
    'Atlas analyzes venues, timelines, and logistics so couples, planners, and vendors plan with certainty and protect every moment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${dm_sans.variable} ${cormorant.variable}`}>{children}</body>
    </html>
  );
}
