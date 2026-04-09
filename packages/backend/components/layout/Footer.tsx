'use client';

import Link from 'next/link';
import { Github, Twitter, ExternalLink } from 'lucide-react';
import { CONTRACTS } from '@/lib/contracts';

export function Footer() {
  const formatAddress = (addr: `0x${string}`) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <footer className="border-t border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="section-container py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold gradient-text mb-4 font-['Orbitron']">GINIX ARCADE</h3>
            <p className="text-sm text-gray-400 mb-4">
              The first truly decentralized arcade platform on Avalanche. Play, earn, and own your achievements on-chain.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link href="/" className="block text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                Home
              </Link>
              <Link href="/leaderboard" className="block text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                Leaderboard
              </Link>
              <Link href="/dashboard" className="block text-sm text-gray-400 hover:text-cyan-400 transition-colors">
                Dashboard
              </Link>
            </div>
          </div>

          {/* Smart Contracts */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Smart Contracts</h4>
            <div className="space-y-2">
              <a
                href={`https://testnet.snowtrace.io/address/${CONTRACTS.registry}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <span>Registry</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://testnet.snowtrace.io/address/${CONTRACTS.core}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <span>Core</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://testnet.snowtrace.io/address/${CONTRACTS.reward}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors"
              >
                <span>Rewards</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-sm font-bold text-white mb-4">Community</h4>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Github className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <Twitter className="w-5 h-5 text-gray-400 hover:text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-gray-500">
            © 2024 Ginix Arcade. Built on Avalanche C-Chain.
          </p>
        </div>
      </div>
    </footer>
  );
}
