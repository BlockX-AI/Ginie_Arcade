'use client';

import { Play, Users, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  players: number;
  highScore: number;
  gradient: 'cyber' | 'plasma';
  icon: string;
}

export function GameCard({ id, title, description, players, highScore, gradient, icon }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const gradientClass = gradient === 'cyber' ? 'cyber-gradient' : 'plasma-gradient';
  const glowClass = gradient === 'cyber' ? 'neon-glow-blue' : 'neon-glow-pink';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative glass-card-hover overflow-hidden hover:scale-[1.03] transition-all duration-500 border-2 border-white/10 hover:border-white/30 hover:-translate-y-2 shadow-2xl hover:shadow-cyan-500/20"
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 ${gradientClass} opacity-5 group-hover:opacity-15 transition-opacity duration-700`}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

      {/* Game Icon/Preview */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-black via-gray-900/80 to-black">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-9xl opacity-40 group-hover:opacity-70 group-hover:scale-125 transition-all duration-700">
            {icon}
          </div>
        </div>

        {/* Hover Overlay with Play Button */}
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
          <Link
            href={`/play/${id}`}
            className={`group/btn relative flex items-center gap-4 px-12 py-6 rounded-2xl ${gradientClass} text-white font-bold ${glowClass} hover:scale-125 transition-all duration-300 shadow-2xl overflow-hidden`}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
            <Play className="w-7 h-7 fill-white relative z-10 group-hover/btn:rotate-90 transition-transform duration-300" />
            <span className="font-['Orbitron'] text-xl relative z-10 tracking-wider">PLAY NOW</span>
          </Link>
        </div>

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 border-2 border-green-500/50 backdrop-blur-md shadow-lg">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]"></div>
            <span className="text-sm text-green-400 font-bold font-['Orbitron']">LIVE</span>
          </div>
        </div>
      </div>

      {/* Game Info */}
      <div className="relative p-8 space-y-6">
        <div className="space-y-3">
          <h3 className="text-3xl font-black gradient-text font-['Orbitron'] tracking-tight group-hover:scale-105 transition-transform duration-300 origin-left">{title}</h3>
          <p className="text-base text-gray-300 leading-relaxed font-light">{description}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-6 pt-6 border-t-2 border-white/10">
          <div className="flex items-center gap-4 group/stat">
            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center group-hover/stat:scale-110 group-hover/stat:rotate-6 transition-all duration-300">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Players</p>
              <p className="text-lg font-black text-white">{players.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 group/stat">
            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 border-2 border-yellow-500/30 flex items-center justify-center group-hover/stat:scale-110 group-hover/stat:rotate-6 transition-all duration-300">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Top Score</p>
              <p className="text-lg font-black text-white font-['Orbitron']">{highScore.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Rewards Info */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 group-hover:border-purple-500/50 transition-all">
          <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
          <span className="text-sm text-purple-200 font-semibold">Earn on-chain XP & blockchain rewards</span>
        </div>
      </div>
    </div>
  );
}
