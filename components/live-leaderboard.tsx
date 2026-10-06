'use client';

import { useEffect, useMemo, useState } from 'react';
import { Trophy, RefreshCw, Users } from 'lucide-react';
import { games, formatNumber } from '@/lib/games';

interface LeaderboardEntry {
  walletAddress: string;
  score: number;
  duration: number | null;
  createdAt: string;
  player?: { xp: number; sessionsPlayed: number };
}

function truncateWallet(addr: string): string {
  if (!addr || addr.length < 12) return addr;
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function LiveLeaderboard() {
  const [selectedGame, setSelectedGame] = useState(games[0].id);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTitle = useMemo(
    () => games.find((g) => g.id === selectedGame)?.title || selectedGame,
    [selectedGame]
  );

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leaderboard?gameId=${selectedGame}&limit=5`);
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const data = await res.json();
      setEntries(data.leaderboard || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedGame]);

  return (
    <section className="bg-black py-28">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center text-center mb-12">
          <p className="font-general text-[10px] uppercase tracking-widest text-white/40">Live Rankings</p>
          <h2 className="mt-4 font-zentry text-3xl uppercase text-white md:text-4xl">On-Chain Leaderboard</h2>
          <p className="mt-4 max-w-md font-circular-web text-white/50">
            Top scores verified in real-time. Pick a game and see who reigns supreme.
          </p>
        </div>

        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-crimson" />
              <span className="font-zentry text-lg uppercase text-white">{selectedTitle}</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm text-white focus:border-crimson/50 focus:outline-none"
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id} className="bg-black">
                    {game.title}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchLeaderboard}
                disabled={loading}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-crimson hover:border-crimson transition-all"
                aria-label="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="mt-8">
            {entries.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="mx-auto h-10 w-10 text-white/10" />
                <p className="mt-3 font-circular-web text-sm text-white/30">No scores yet. Be the first to play!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {entries.map((entry, index) => (
                  <div
                    key={`${entry.walletAddress}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-zentry text-xl w-6 text-center ${
                          index < 3 ? 'text-crimson' : 'text-white/30'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-mono text-sm text-white/80">{truncateWallet(entry.walletAddress)}</p>
                        <p className="text-[10px] text-white/30">{timeAgo(entry.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-zentry text-xl text-white">{formatNumber(entry.score)}</p>
                      <p className="text-[10px] text-white/30">{entry.duration ? `${entry.duration}s` : '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <p className="mt-4 text-center text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </section>
  );
}
