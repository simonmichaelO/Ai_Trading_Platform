/**
 * Root Layout
 * 
 * The top-level HTML wrapper for every page.
 * - Sets dark mode as default
 * - Loads global fonts and styles
 * - Provides the QueryClient provider (React Query)
 */

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/shared/Providers';

// Font configuration — Inter for body, JetBrains Mono for code/data
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AI Trading Platform',
  description: 'Professional AI-powered trading analysis platform',
  keywords: ['trading', 'AI', 'analysis', 'forex', 'crypto', 'stocks'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
