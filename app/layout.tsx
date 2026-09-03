// Root layout. Keep server-rendered (no "use client" here).
// See Code_Structure_Rules_Next/app-router-structure.md.
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import '@/libs/icons';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// icon.svg / favicon.ico / apple-icon.png / opengraph-image.png sit next to this
// file and are picked up by Next's file conventions — no `icons` block needed.
// They're generated from the brand mark by scripts/generate-brand-assets.ts.
const SITE_URL = 'https://learn.kuray.dev';
const TITLE = 'learn.kuray.dev — Engineer Roadmap';
const DESCRIPTION = 'Path to the software business era.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: 'learn.kuray.dev',
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'learn.kuray.dev',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
