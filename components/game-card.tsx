'use client';

import Link from 'next/link';
import { Rocket, Puzzle, Bird, Grid3x3, Users, Trophy, Play, Zap, Sparkles, Gem, Worm, Home, Circle, Skull } from 'lucide-react';
import type { Game } from '@/lib/games';
import { formatNumber } from '@/lib/games';

const iconMap = {
  Rocket,
  Puzzle,
  Bird,
  Grid3x3,
  Gem,
  Worm,
  Home,
  Circle,
  Skull,
};

// Category-specific accent colors
const categoryColors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  'Endless Runner': { bg: 'from-cyan-500/20 to-blue-600/20', border: 'border-cyan-500/30', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' },
  'Puzzle': { bg: 'from-purple-500/20 to-pink-600/20', border: 'border-purple-500/30', text: 'text-purple-400', glow: 'shadow-purple-500/30' },
  'Arcade': { bg: 'from-orange-500/20 to-red-600/20', border: 'border-orange-500/30', text: 'text-orange-400', glow: 'shadow-orange-500/30' },
};

interface GameCardProps {
  game: Game;
  index?: number;
}

export function GameCard({ game, index = 0 }: GameCardProps) {
  const Icon = iconMap[game.icon as keyof typeof iconMap] || Rocket;
  const colors = categoryColors[game.category] || categoryColors['Arcade'];

  return (
    <Link href={`/play/${game.id}`} className="group block">
      <div
        className={`relative overflow-hidden rounded-2xl border ${colors.border} bg-gradient-to-b from-white/[0.03] to-black/40 backdrop-blur-sm transition-all duration-500 hover:border-crimson/50 hover:shadow-2xl ${colors.glow} hover:scale-[1.02]`}
        style={{ animationDelay: `${index * 100}ms` }}
      >
        {/* Animated gradient background on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(220,20,60,0.15),transparent_70%)]" />
        </div>

        {/* Animated corner accents */}
        <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-2 left-2 w-8 h-px bg-gradient-to-r from-crimson/60 to-transparent group-hover:w-12 transition-all duration-500" />
          <div className="absolute top-2 left-2 h-8 w-px bg-gradient-to-b from-crimson/60 to-transparent group-hover:h-12 transition-all duration-500" />
        </div>
        <div className="absolute bottom-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute bottom-2 right-2 w-8 h-px bg-gradient-to-l from-crimson/60 to-transparent group-hover:w-12 transition-all duration-500" />
          <div className="absolute bottom-2 right-2 h-8 w-px bg-gradient-to-t from-crimson/60 to-transparent group-hover:h-12 transition-all duration-500" />
        </div>

        {/* Game Preview Area */}
        <div className="relative aspect-[16/10] flex items-center justify-center overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-transparent to-black/60" />
          <div className="absolute inset-0 grid-pattern opacity-20 group-hover:opacity-40 transition-opacity duration-500" />

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-crimson/40 rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
            <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-crimson/30 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Icon with glow effect */}
          <div className="relative z-10 transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-2">
            <div className={`${colors.text} transition-colors duration-300 group-hover:text-crimson`}>
              <Icon className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24" strokeWidth={1} />
            </div>
            {/* Glow blur behind icon */}
            <div className="absolute inset-0 blur-3xl opacity-30 group-hover:opacity-60 transition-opacity duration-500">
              <Icon className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-crimson" strokeWidth={1} />
            </div>
          </div>

          {/* Play button - appears on hover */}
          <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 flex items-end justify-center pb-6">
            <div className="flex items-center gap-2 rounded-full bg-crimson px-6 py-3 font-robert-medium text-sm text-white shadow-lg shadow-crimson/40 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-400">
              <Play className="h-4 w-4" fill="currentColor" />
              Play Now
            </div>
          </div>

          {/* Category Badge - top left */}
          <div className={`absolute top-4 left-4 z-10 rounded-lg ${colors.border} bg-black/70 backdrop-blur-md px-3 py-1.5 shadow-lg`}>
            <span className={`font-general text-[9px] uppercase tracking-widest ${colors.text} font-semibold`}>
              {game.category}
            </span>
          </div>

          {/* Hot badge for popular games */}
          {game.players > 10000 && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-2.5 py-1 shadow-lg">
              <Zap className="h-3 w-3 text-white" fill="currentColor" />
              <span className="font-general text-[8px] uppercase tracking-wider text-white font-bold">Hot</span>
            </div>
          )}
        </div>

        {/* Content section */}
        <div className="relative z-10 p-5 sm:p-6">
          {/* Title */}
          <h3 className="font-zentry text-lg sm:text-xl uppercase leading-tight text-white group-hover:text-crimson transition-colors duration-300 tracking-wide">
            {game.title}
          </h3>

          {/* Description */}
          <p className="mt-2 sm:mt-3 text-[13px] sm:text-sm text-white/50 font-circular-web line-clamp-2 leading-relaxed tracking-wide">
            {game.description}
          </p>

          {/* Stats bar */}
          <div className="mt-4 sm:mt-5 flex items-center gap-4 sm:gap-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                <Users className="h-3.5 w-3.5 text-crimson/70" />
              </div>
              <div>
                <p className="font-robert-medium text-sm text-white/90 tracking-wide">{formatNumber(game.players)}</p>
                <p className="font-general text-[8px] uppercase tracking-widest text-white/30">Players</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 border border-white/10">
                <Trophy className="h-3.5 w-3.5 text-gold/70" />
              </div>
              <div>
                <p className="font-robert-medium text-sm text-white/90 tracking-wide">{formatNumber(game.highScore)}</p>
                <p className="font-general text-[8px] uppercase tracking-widest text-white/30">High Score</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-crimson/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </Link>
  );
}
