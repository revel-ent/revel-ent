import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';

import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal', 'italic']
});

export const metadata: Metadata = {
  title: 'Atlas — The Intelligence Layer for Events',
  description:
    'Atlas analyzes venues, timelines, and logistics so couples, planners, and vendors plan with certainty and protect every moment.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body className={`${inter.variable} ${newsreader.variable}`}>{children}</body>
    </html>
  );
}
