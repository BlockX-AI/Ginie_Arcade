import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Ginix Arcade | Play. Earn. Dominate.',
  description:
    'The premier Web3 blockchain arcade gaming platform. Play exciting games, earn rewards, and compete on global leaderboards.',
  icons: {
    icon: '/Ginie.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#DC143C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ backgroundColor: '#000' }}>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${jetbrains.variable} font-circular-web antialiased bg-black text-white min-h-screen overflow-x-hidden`}
      >
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
