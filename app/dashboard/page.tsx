
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Zap, Target, Award, TrendingUp, Gamepad2, Clock, ExternalLink, Shield, ArrowRight } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  tier: string;
  minted: boolean;
  txHash?: string | null;
}

interface RecentGame {
  gameId: string;
  score: number | null;
  duration: number | null;
  startedAt: string;
}

interface PlayerStats {
  xp: number;
  level: number;
  sessionsPlayed: number;
  achievements: { type: string; gameId: string; score: number | null }[];
  recentGames: RecentGame[];
  highScores: Record<string, number>;
  badges: Badge[];
}

const GAME_NAMES: Record<string, string> = {
  'neon-sky-runner': 'Neon Sky Runner',
  'tilenova': 'TileNova',
  'flappy': 'Flappy Bird',
  'sudoku': 'Sudoku',
};

const TIER_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  bronze: { border: 'border-orange-600/30', bg: 'bg-orange-600/10', text: 'text-orange-400' },
  silver: { border: 'border-gray-400/30', bg: 'bg-gray-400/10', text: 'text-gray-300' },
  gold: { border: 'border-gold/30', bg: 'bg-gold/10', text: 'text-gold' },
  platinum: { border: 'border-blue-300/30', bg: 'bg-blue-300/10', text: 'text-blue-300' },
};

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [nfts, setNfts] = useState<{ tokenId: string; name: string; description: string | null; image: string | null; explorer: string; badgeId?: string | null }[]>([]);
  const [nftsLoading, setNftsLoading] = useState(false);

  const pageRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('.dash-anim-in', {
        y: 16,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.08,
        clearProps: 'transform,opacity',
      });
    },
    { scope: pageRef }
  );

  useEffect(() => {
    if (!address) return;
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/playerStats?wallet=${address}`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch player stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [address]);

  useEffect(() => {
    if (!address) return;
    const fetchNfts = async () => {
      setNftsLoading(true);
      try {
        const res = await fetch(`/api/nfts?wallet=${address}`);
        const data = await res.json();
        if (res.ok && Array.isArray(data?.nfts)) {
          setNfts(
            data.nfts.map((n: any) => ({
              tokenId: String(n.tokenId),
              name: typeof n.name === 'string' ? n.name : `Token #${String(n.tokenId)}`,
              description: typeof n.description === 'string' ? n.description : null,
              image: typeof n.image === 'string' ? n.image : null,
              explorer: typeof n.explorer === 'string' ? n.explorer : '',
              badgeId: typeof n.badgeId === 'string' ? n.badgeId : null,
            }))
          );
        } else {
          setNfts([]);
        }
      } catch (err) {
        console.error('Failed to fetch NFTs:', err);
        setNfts([]);
      } finally {
        setNftsLoading(false);
      }
    };
    fetchNfts();
  }, [address]);

  if (!isConnected) {
    return (
      <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
        <div className="page-header">
          <div className="page-header-bg">
            <img src="/img/breadcrumb.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
          </div>
          <div className="dash-anim-in relative z-10 container mx-auto px-6 md:px-10 text-center">
            <p className="font-general text-[10px] uppercase tracking-widest text-crimson">Dashboard</p>
            <h1 className="mt-4 font-zentry text-5xl font-black uppercase text-white md:text-7xl">
              Pl<b className="text-crimson">a</b>yer Hub
            </h1>
          </div>
        </div>
        <div className="container mx-auto px-6 md:px-10 -mt-4 relative z-20">
          <div className="dash-anim-in max-w-md mx-auto rounded-2xl border border-white/5 bg-white/[0.01] p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-crimson/10 border border-crimson/20 mx-auto mb-6">
              <Award className="h-8 w-8 text-crimson" />
            </div>
            <h2 className="font-zentry text-2xl font-bold uppercase text-white mb-3">Connect Wallet</h2>
            <p className="font-circular-web text-sm text-white/40 mb-8">
              Connect your wallet to view your stats, badges, and on-chain achievements.
            </p>
            <div className="flex items-center justify-center">
              <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading || !stats) {
    return (
      <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
        <div className="flex items-center justify-center pt-40">
          <div className="text-center">
            <div className="three-body"><div className="three-body__dot" /><div className="three-body__dot" /><div className="three-body__dot" /></div>
            <p className="mt-6 font-circular-web text-sm text-white/30">Loading your stats...</p>
          </div>
        </div>
      </main>
    );
  }

  const { xp, level, sessionsPlayed, highScores, badges, recentGames } = stats;
  const earnedBadges = badges.filter((b) => b.earned);
  const unearnedBadges = badges.filter((b) => !b.earned);
  const badgeNftsById = new Map(
    nfts
      .filter((n) => typeof n.badgeId === 'string' && n.badgeId.length > 0)
      .map((n) => [n.badgeId as string, n])
  );

  const nonBadgeNfts = nfts.filter((n) => !n.badgeId);
  const xpProgress = xp % 100;
  const nextLevelXp = Math.ceil(xp / 100) * 100 || 100;

  const statCards = [
    { icon: Zap, label: 'Total XP', value: xp.toLocaleString(), accent: 'text-crimson' },
    { icon: Target, label: 'Level', value: String(level), accent: 'text-gold' },
    { icon: Trophy, label: 'Sessions', value: String(sessionsPlayed), accent: 'text-white' },
    { icon: Award, label: 'Badges', value: `${earnedBadges.length}/${badges.length}`, accent: 'text-orange-400' },
  ];

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-bg">
          <img src="/img/breadcrumb.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        </div>
        <div className="dash-anim-in relative z-10 container mx-auto px-6 md:px-10">
          <p className="font-general text-[10px] uppercase tracking-widest text-crimson">Player Profile</p>
          <h1 className="mt-4 font-zentry text-5xl font-black uppercase text-white md:text-7xl">
            Da<b className="text-crimson">s</b>hbo<b className="text-crimson">a</b>rd
          </h1>
          <p className="mt-3 font-mono text-xs text-white/30">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-10 -mt-4 relative z-20 pb-28">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mb-10">
          {statCards.map((s) => (
            <div key={s.label} className="dash-anim-in rounded-xl border border-white/5 bg-white/[0.01] p-5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/5">
                  <s.icon className="h-4 w-4 text-white/40" />
                </div>
                <span className="font-general text-[9px] uppercase tracking-wider text-white/30">{s.label}</span>
              </div>
              <p className={`font-zentry text-2xl font-bold md:text-3xl ${s.accent}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Level Progress */}
        <div className="dash-anim-in rounded-xl border border-white/5 bg-white/[0.01] p-6 mb-10">
          <div className="flex items-center justify-between mb-4">
            <p className="font-robert-medium text-xs text-white/60">Level Progress</p>
            <div className="flex items-center gap-1.5 rounded-md bg-crimson/10 border border-crimson/20 px-3 py-1">
              <TrendingUp className="h-3 w-3 text-crimson" />
              <span className="font-general text-[9px] uppercase tracking-wider text-crimson">{xpProgress}% to Lvl {level + 1}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-zentry text-3xl font-bold text-white">{level}</span>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-crimson to-electric-red transition-all duration-1000" style={{ width: `${xpProgress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="font-general text-[9px] text-white/20">{xp} XP</span>
                <span className="font-general text-[9px] text-white/20">{nextLevelXp} XP</span>
              </div>
            </div>
            <span className="font-zentry text-3xl font-bold text-white/20">{level + 1}</span>
          </div>
        </div>

        {/* High Scores */}
        <div className="mb-10">
          <p className="font-robert-medium text-xs uppercase tracking-wider text-white/40 mb-4">High Scores</p>
          <div className="grid gap-3 md:grid-cols-3">
            {['neon-sky-runner', 'tilenova', 'flappy'].map((gid) => (
              <Link key={gid} href={`/play/${gid}`} className="dash-anim-in group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-5 hover:border-crimson/20 hover:bg-crimson/[0.02] transition-all">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:border-crimson/20 transition-colors">
                  <Gamepad2 className="h-5 w-5 text-white/30 group-hover:text-crimson transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-robert-medium text-sm text-white truncate">{GAME_NAMES[gid]}</p>
                  <p className="font-general text-[9px] uppercase tracking-wider text-white/20">Personal Best</p>
                </div>
                <p className="font-zentry text-xl font-bold text-crimson">{(highScores[gid] || 0).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-12">
          {/* Section Header */}
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson/10 border border-crimson/20">
                  <Trophy className="h-4 w-4 text-crimson" />
                </div>
                <p className="font-zentry text-lg font-bold uppercase text-white">
                  Achievements <span className="text-crimson">({earnedBadges.length}/{badges.length})</span>
                </p>
              </div>
              <p className="font-circular-web text-sm text-white/40">
                Earn badges in-game. Minted badges appear on-chain as NFTs.
              </p>
            </div>
            {nftsLoading && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-crimson animate-pulse" />
                <p className="font-general text-[10px] uppercase tracking-wider text-white/40">Syncing NFTs…</p>
              </div>
            )}
          </div>

          {/* Unlocked Achievements */}
          {earnedBadges.length > 0 && (
            <div className="mb-8">
              <p className="font-general text-[10px] uppercase tracking-widest text-green-400/80 mb-4 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Unlocked ({earnedBadges.length})
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {earnedBadges.map((badge) => {
                  const ts = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
                  const nft = badge.minted ? badgeNftsById.get(badge.id) : undefined;
                  const txUrl = badge.txHash ? `https://testnet.snowtrace.io/tx/${badge.txHash}` : null;
                  const CardWrapper = txUrl ? 'a' : 'div';
                  const cardProps = txUrl ? { href: txUrl, target: '_blank', rel: 'noopener noreferrer' } : {};
                  return (
                    <CardWrapper
                      key={badge.id}
                      {...cardProps}
                      className={`group relative overflow-hidden rounded-2xl border-2 ${ts.border} bg-gradient-to-b from-white/[0.03] to-transparent transition-all duration-300 ${txUrl ? 'cursor-pointer hover:scale-[1.02] hover:border-crimson/50 hover:shadow-xl hover:shadow-crimson/15' : ''}`}
                    >
                      {/* NFT Image Area - 65% of card */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/60">
                        {nft?.image ? (
                          <img
                            src={nft.image}
                            alt={badge.name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-white/5 to-transparent">
                            <span className="text-7xl opacity-80">{badge.icon}</span>
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                        {/* NFT Badge */}
                        {badge.minted && (
                          <div className="absolute top-3 right-3 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-500/40 px-2.5 py-1 shadow-lg">
                            <span className="font-general text-[9px] uppercase tracking-wider text-green-400 font-bold">NFT</span>
                          </div>
                        )}

                        {/* Tier Badge */}
                        <div className="absolute top-3 left-3">
                          <span className={`inline-block rounded-full ${ts.bg} backdrop-blur-sm border ${ts.border} px-2.5 py-1 font-general text-[9px] uppercase tracking-wider ${ts.text} font-bold shadow-lg`}>
                            {badge.tier}
                          </span>
                        </div>
                      </div>

                      {/* Info Area - 35% of card */}
                      <div className="p-4 bg-gradient-to-b from-black/40 to-black/60">
                        <h4 className="font-robert-medium text-base text-white mb-1 truncate">{badge.name}</h4>
                        <p className="font-circular-web text-xs text-white/50 line-clamp-2 leading-relaxed">{badge.description}</p>
                        {txUrl && (
                          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-crimson/80 group-hover:text-crimson transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span className="font-medium">View on Explorer</span>
                          </div>
                        )}
                      </div>
                    </CardWrapper>
                  );
                })}
              </div>
            </div>
          )}

          {/* Locked Achievements */}
          {unearnedBadges.length > 0 && (
            <div>
              <p className="font-general text-[10px] uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Locked ({unearnedBadges.length})
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {unearnedBadges.map((badge) => {
                  const ts = TIER_STYLES[badge.tier] || TIER_STYLES.bronze;
                  return (
                    <div
                      key={badge.id}
                      className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] transition-all duration-300 hover:border-white/10 hover:bg-white/[0.03]"
                    >
                      {/* Locked Image Area */}
                      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-white/[0.02] to-transparent">
                        <img
                          src={`/badges/${badge.id}.png`}
                          alt={badge.name}
                          className="h-full w-full object-cover grayscale opacity-25"
                          loading="lazy"
                          decoding="async"
                        />
                        {/* Lock overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Shield className="h-8 w-8 text-white/15" />
                        </div>

                        {/* Tier indicator */}
                        <div className="absolute top-2 left-2">
                          <span className={`inline-block rounded-full bg-white/5 border border-white/10 px-2 py-0.5 font-general text-[7px] uppercase tracking-wider text-white/25`}>
                            {badge.tier}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 border-t border-white/5">
                        <h4 className="font-robert-medium text-[11px] text-white/30 mb-0.5 truncate">{badge.name}</h4>
                        <p className="font-circular-web text-[9px] text-white/20 line-clamp-2">{badge.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional NFTs (non-badge) */}
          {nonBadgeNfts.length > 0 && (
            <div className="mt-8">
              <p className="font-general text-[10px] uppercase tracking-widest text-purple-400/80 mb-4 flex items-center gap-2">
                <Award className="h-3.5 w-3.5" />
                Other NFTs ({nonBadgeNfts.length})
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {nonBadgeNfts.map((nft) => (
                  <a
                    key={nft.tokenId}
                    href={nft.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-anim-in group overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-b from-purple-500/5 to-transparent hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/10 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="aspect-[4/3] w-full bg-black/40 relative overflow-hidden">
                      {nft.image ? (
                        <img src={nft.image} alt={nft.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" decoding="async" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Award className="h-16 w-16 text-white/10" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 rounded-full bg-purple-500/20 backdrop-blur-sm border border-purple-500/40 px-2 py-0.5">
                        <span className="font-mono text-[9px] text-purple-300">#{nft.tokenId}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="font-robert-medium text-sm text-white truncate">{nft.name}</p>
                      {nft.description && (
                        <p className="mt-1 font-circular-web text-[11px] text-white/40 line-clamp-2">{nft.description}</p>
                      )}
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-purple-400/80 group-hover:text-purple-400 transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span className="font-medium">View on Explorer</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Games Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <p className="font-zentry text-lg font-bold uppercase text-white">
              Recent <span className="text-blue-400">Activity</span>
            </p>
          </div>

          {recentGames.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 mx-auto mb-6">
                <Gamepad2 className="h-8 w-8 text-white/20" />
              </div>
              <p className="font-robert-medium text-lg text-white/50 mb-2">No games played yet</p>
              <p className="font-circular-web text-sm text-white/30 mb-8">Start playing to see your activity here</p>
              <Link href="/library" className="inline-flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-sm font-robert-medium uppercase tracking-wider text-white hover:bg-electric-red hover:scale-105 transition-all shadow-lg shadow-crimson/20">
                <Gamepad2 className="h-4 w-4" />
                Play Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentGames.map((game, idx) => (
                <Link
                  key={idx}
                  href={`/play/${game.gameId}`}
                  className="group flex items-center gap-4 rounded-2xl border border-white/5 bg-gradient-to-r from-white/[0.02] to-transparent p-5 hover:border-blue-500/20 hover:from-blue-500/5 transition-all duration-300"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-white/10 group-hover:border-blue-500/30 transition-colors">
                    <Gamepad2 className="h-6 w-6 text-blue-400/70 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-robert-medium text-base text-white group-hover:text-blue-100 transition-colors">{GAME_NAMES[game.gameId] || game.gameId}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-white/30">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{game.duration || 0}s</span>
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      <span>{new Date(game.startedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-zentry text-2xl font-bold text-white/90 group-hover:text-blue-100 transition-colors">{(game.score || 0).toLocaleString()}</p>
                    <p className="font-general text-[9px] uppercase tracking-wider text-white/25">points</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-white/10 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { href: '/library', icon: Zap, label: 'Play More Games', sub: 'Continue earning XP' },
            { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', sub: 'Check your ranking' },
            { href: '/blog', icon: Shield, label: 'Guides & Tips', sub: 'Level up your skills' },
          ].map((action) => (
            <Link key={action.href} href={action.href} className="group flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.01] p-5 hover:border-crimson/20 hover:bg-crimson/[0.02] transition-all">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/5 group-hover:border-crimson/20 transition-colors">
                <action.icon className="h-5 w-5 text-white/30 group-hover:text-crimson transition-colors" />
              </div>
              <div className="flex-1">
                <p className="font-robert-medium text-sm text-white">{action.label}</p>
                <p className="font-circular-web text-[10px] text-white/25">{action.sub}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/10 group-hover:text-crimson/50 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
