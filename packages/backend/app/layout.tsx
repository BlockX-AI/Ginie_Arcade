'use client';

import { Inter, Space_Grotesk, Orbitron } from 'next/font/google';
import './globals.css';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/web3';
import '@rainbow-me/rainbowkit/styles.css';
import { useState } from 'react';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });
const orbitron = Orbitron({ subsets: ['latin'], variable: '--font-orbitron' });

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>Ginix Arcade - Web3 Gaming Platform</title>
        <meta name="description" content="Play arcade games, earn on-chain rewards on Avalanche" />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${orbitron.variable} font-sans antialiased`}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={darkTheme({
                accentColor: '#00D9FF',
                accentColorForeground: 'white',
                borderRadius: 'large',
                fontStack: 'system',
              })}
            >
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
