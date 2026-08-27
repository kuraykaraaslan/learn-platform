// Root layout. Keep server-rendered (no "use client" here).
// See Code_Structure_Rules_Next/app-router-structure.md.
import { Geist, Geist_Mono } from 'next/font/google';
import { Providers } from './providers';
import '@/libs/icons';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata = {
  title: 'learn.kuray.dev — Engineer Roadmap',
  description: 'Path to the software business era.',
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
