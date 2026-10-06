'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo, useEffect } from 'react';

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css';

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

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl('devnet'), []);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
