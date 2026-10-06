'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Trophy, Medal, Award, Crown, Zap, Star, Gamepad2, Shield } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  duration: number;
}

interface GlobalLeaderboardEntry {
  rank: number;
  wallet: string;
  walletShort: string;
  xp: number;
  level: number;
  sessionsPlayed: number;
  achievements: number;
}

type TabType = 'global' | 'neon-sky-runner' | 'tilenova' | 'flappy';

const tabs: { id: TabType; label: string; sub: string; icon: React.ElementType }[] = [
  { id: 'global', label: 'Global XP', sub: 'All Players', icon: Crown },
  { id: 'neon-sky-runner', label: 'Neon Sky Runner', sub: 'Endless Runner', icon: Zap },
  { id: 'tilenova', label: 'TileNova', sub: 'Puzzle Strategy', icon: Gamepad2 },
  { id: 'flappy', label: 'Flappy Bird', sub: 'Classic Arcade', icon: Star },
];

export default function Leaderboard() {
  const [selectedTab, setSelectedTab] = useState<TabType>('global');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const pageRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.lb-anim-in', {
        y: 18,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        clearProps: 'transform,opacity',
      });
    },
    { scope: pageRef }
  );

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        if (selectedTab === 'global') {
          const response = await fetch('/api/leaderboard/global');
          const data = await response.json();
          setGlobalLeaderboard(data?.leaderboard || []);
        } else {
          const response = await fetch(`/api/leaderboard?gameId=${selectedTab}`);
          const data = await response.json();
          const leaderboardData = Array.isArray(data) ? data : (data?.leaderboard || []);
          setLeaderboard(leaderboardData);
        }
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboard([]);
        setGlobalLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [selectedTab]);

  const formatAddress = (addr?: string | null) => {
    if (!addr) return '—';
    if (addr.length <= 14) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const rankColors: Record<number, { text: string; bg: string; border: string }> = {
    1: { text: 'text-gold', bg: 'bg-gold/10', border: 'border-gold/30' },
    2: { text: 'text-gray-300', bg: 'bg-gray-300/10', border: 'border-gray-300/20' },
    3: { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-gold" />;
    if (rank === 2) return <Trophy className="h-4 w-4 text-gray-300" />;
    if (rank === 3) return <Medal className="h-4 w-4 text-orange-400" />;
    return null;
  };

  const renderRow = (rank: number, wallet: string | undefined, mainValue: number, mainLabel: string, subInfo: string) => {
    const colors = rankColors[rank];
    const isTop3 = rank <= 3;

    return (
      <div
        key={rank + (wallet ?? '')}
        className={`lb-row flex items-center gap-4 rounded-xl border p-4 md:p-5 transition-all duration-200 hover:bg-white/[0.03] ${
          isTop3 ? `${colors?.border} ${colors?.bg}` : 'border-white/5 bg-white/[0.01]'
        }`}
      >
        {/* Rank */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          isTop3 ? `${colors?.bg} border ${colors?.border}` : 'bg-white/5 border border-white/5'
        }`}>
          {getRankIcon(rank) || (
            <span className={`font-zentry text-sm font-bold ${isTop3 ? colors?.text : 'text-white/30'}`}>
              {rank}
            </span>
          )}
        </div>

        {/* Wallet */}
        <div className="flex-1 min-w-0">
          <p className={`font-mono text-sm font-medium ${isTop3 ? 'text-white' : 'text-white/70'}`}>
            {wallet || 'Unknown'}
          </p>
          <p className="font-circular-web text-[11px] text-white/30 mt-0.5">{subInfo}</p>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <p className={`font-zentry text-xl font-bold ${isTop3 ? colors?.text : 'text-white/80'}`}>
            {mainValue.toLocaleString()}
          </p>
          <p className="font-general text-[9px] uppercase tracking-wider text-white/20">{mainLabel}</p>
        </div>
      </div>
    );
  };

  const renderEmpty = () => (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-16 text-center">
      <Trophy className="h-12 w-12 text-white/10 mx-auto mb-5" />
      <h3 className="font-zentry text-xl font-bold uppercase text-white mb-2">No Scores Yet</h3>
      <p className="font-circular-web text-sm text-white/40 mb-8">Be the first to set a high score!</p>
      <Link
        href={selectedTab === 'global' ? '/library' : `/play/${selectedTab}`}
        className="inline-flex items-center gap-2 rounded-full bg-crimson px-6 py-3 text-xs font-robert-medium uppercase tracking-wider text-white hover:bg-electric-red transition-colors"
      >
        <Zap className="h-3.5 w-3.5" />
        Play Now
      </Link>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center py-20">
      <div className="three-body"><div className="three-body__dot" /><div className="three-body__dot" /><div className="three-body__dot" /></div>
      <p className="mt-6 font-circular-web text-sm text-white/30">Loading rankings...</p>
    </div>
  );

  const data = selectedTab === 'global' ? globalLeaderboard : leaderboard;

  useEffect(() => {
    if (loading) return;
    if (!listRef.current) return;

    gsap.killTweensOf(listRef.current);
    gsap.fromTo(
      listRef.current.querySelectorAll('.lb-row'),
      { y: 10, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.035,
        clearProps: 'transform,opacity',
      }
    );
  }, [selectedTab, loading]);

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      {/* Header */}
      <div className="page-header lb-anim-in">
        <div className="page-header-bg">
          <img src="/img/breadcrumb.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        </div>
        <div className="relative z-10 container mx-auto px-6 md:px-10 text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-crimson">Rankings</p>
          <h1 className="mt-4 font-zentry text-5xl font-black uppercase text-white md:text-7xl">
            Le<b className="text-crimson">a</b>der<b className="text-crimson">b</b>oard
          </h1>
          <p className="mt-4 max-w-lg mx-auto font-circular-web text-white/50">
            Compete for the top spot. All scores verified on-chain with anti-cheat protection.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-10 -mt-4 relative z-20">
        {/* Tabs */}
        <div className="lb-anim-in flex items-center gap-2 overflow-x-auto pb-2 mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`shrink-0 flex items-center gap-2.5 rounded-xl px-5 py-3 transition-all duration-200 border ${
                selectedTab === tab.id
                  ? 'border-crimson/30 bg-crimson/10 text-crimson'
                  : 'border-white/5 bg-white/[0.02] text-white/40 hover:border-white/10 hover:text-white/60'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <div className="text-left">
                <p className="font-robert-medium text-xs leading-tight">{tab.label}</p>
                <p className="font-general text-[8px] uppercase tracking-wider opacity-50">{tab.sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto pb-28">
          {loading ? renderLoading() : (
            <>
              {(selectedTab === 'global' ? globalLeaderboard.length === 0 : leaderboard.length === 0) ? renderEmpty() : (
                <div ref={listRef} className="space-y-2">
                  {selectedTab === 'global'
                    ? globalLeaderboard.map((entry) =>
                        renderRow(entry.rank, entry.walletShort, entry.xp, 'total xp', `Lvl ${entry.level} · ${entry.sessionsPlayed} sessions · ${entry.achievements} badges`)
                      )
                    : leaderboard.map((entry) =>
                        renderRow(
                          entry.rank,
                          formatAddress(entry.walletAddress),
                          entry.score,
                          'points',
                          `${entry.duration}s · ${Math.round(entry.score / Math.max(entry.duration, 1))}/s`
                        )
                      )
                  }
                </div>
              )}

              {/* Info */}
              {data.length > 0 && (
                <div className="mt-10 flex items-start gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-5">
                  <Shield className="h-5 w-5 text-crimson shrink-0 mt-0.5" />
                  <div>
                    <p className="font-robert-medium text-xs text-white/60 mb-1">How Rankings Work</p>
                    <p className="font-circular-web text-[11px] text-white/30 leading-relaxed">
                      {selectedTab === 'global'
                        ? 'Global rankings are based on total XP earned across all games. Play more and hit milestones to climb.'
                        : 'All scores are verified on-chain with anti-cheat protection. Only your highest score counts.'}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
