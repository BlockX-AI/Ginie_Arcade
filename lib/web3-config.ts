'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import type { Config } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

if (!projectId && process.env.NODE_ENV !== 'production') {
  // Avoid noisy repeated logs; still allow app to run in dev.
  // Wallet connections will be unreliable until you set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
  console.warn('[Ginix] Missing NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. WalletConnect may not work correctly.');
}

const globalForWagmi = globalThis as unknown as { __ginixWagmiConfig?: Config };

const createWagmiConfig = () =>
  getDefaultConfig({
    appName: 'Ginix Arcade',
    projectId: projectId || 'YOUR_PROJECT_ID',
    chains: [avalancheFuji],
    ssr: true,
  }) as unknown as Config;

export const config: Config = globalForWagmi.__ginixWagmiConfig || createWagmiConfig();

if (process.env.NODE_ENV !== 'production') globalForWagmi.__ginixWagmiConfig = config;
