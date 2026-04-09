'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';
import { Gamepad2, Home, Trophy, LayoutDashboard, Target } from 'lucide-react';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 to-black/80 backdrop-blur-2xl border-b border-white/20 shadow-lg">
      <div className="section-container py-5">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-12 h-12 rounded-xl cyber-gradient flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg group-hover:shadow-cyan-500/50">
              <Gamepad2 className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-2xl font-black gradient-text font-['Orbitron'] tracking-wider drop-shadow-[0_0_10px_rgba(0,217,255,0.5)]">GINIX</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/"
              className="group text-gray-300 hover:text-white transition-all font-semibold text-base relative"
            >
              <span className="group-hover:text-cyan-400 transition-colors">Home</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300"></div>
            </Link>
            <Link
              href="/leaderboard"
              className="group text-gray-300 hover:text-white transition-all font-semibold text-base flex items-center gap-2 relative"
            >
              <Trophy className="w-5 h-5 group-hover:text-yellow-400 group-hover:scale-110 transition-all" />
              <span className="group-hover:text-yellow-400 transition-colors">Leaderboard</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-yellow-400 group-hover:w-full transition-all duration-300"></div>
            </Link>
            {mounted && isConnected && (
              <Link
                href="/dashboard"
                className="group text-gray-300 hover:text-white transition-all font-semibold text-base flex items-center gap-2 relative"
              >
                <LayoutDashboard className="w-5 h-5 group-hover:text-purple-400 group-hover:scale-110 transition-all" />
                <span className="group-hover:text-purple-400 transition-colors">Dashboard</span>
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-400 group-hover:w-full transition-all duration-300"></div>
              </Link>
            )}
          </div>

          {/* Wallet Connect */}
          <div className={mounted ? 'opacity-100' : 'opacity-0'}>
            <ConnectButton 
              chainStatus="icon"
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
