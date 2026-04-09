'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { config } from '@/lib/web3-config';
import '@rainbow-me/rainbowkit/styles.css';
import { useEffect } from 'react';

const globalForQueryClient = globalThis as unknown as { __ginixQueryClient?: QueryClient };
const queryClient = globalForQueryClient.__ginixQueryClient || new QueryClient();

if (process.env.NODE_ENV !== 'production') globalForQueryClient.__ginixQueryClient = queryClient;

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const ua = window.navigator.userAgent || '';
    const html = document.documentElement;

    if (/Android/i.test(ua)) html.classList.add('platform-android');
    if (/Windows/i.test(ua)) html.classList.add('platform-windows');
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#DC143C',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
