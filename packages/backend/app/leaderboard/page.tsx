'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Trophy, Medal, Award, Crown, Zap } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  score: number;
  duration: number;
}

export default function Leaderboard() {
  const [selectedGame, setSelectedGame] = useState<string>('neon-sky-runner');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?gameId=${selectedGame}`);
        const data = await response.json();
        setLeaderboard(data || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedGame]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-2">
          <Crown className="w-7 h-7 text-yellow-400 animate-pulse" />
          <span className="text-2xl font-bold text-yellow-400">#1</span>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gray-300" />
          <span className="text-xl font-bold text-gray-300">#2</span>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-2">
          <Medal className="w-6 h-6 text-orange-400" />
          <span className="text-xl font-bold text-orange-400">#3</span>
        </div>
      );
    }
    return <span className="text-lg text-gray-500 font-['Orbitron']">#{rank}</span>;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-yellow-500/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <Navbar />
      
      <div className="relative pt-32 pb-20 px-4">
        <div className="section-container">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-yellow-500/30 mb-6">
              <Trophy className="w-4 h-4 text-yellow-400 animate-pulse" />
              <span className="text-sm text-yellow-400 font-['Orbitron'] font-bold">TOP PLAYERS</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text font-['Orbitron']">LEADERBOARD</span>
            </h1>
            <p className="text-gray-400 text-xl max-w-2xl mx-auto">
              Compete for the top spot and prove you're the best
            </p>
          </div>

          {/* Game Tabs */}
          <div className="flex justify-center gap-4 mb-12">
            <button
              onClick={() => setSelectedGame('neon-sky-runner')}
              className={`px-8 py-4 rounded-xl font-bold transition-all ${
                selectedGame === 'neon-sky-runner'
                  ? 'cyber-gradient text-white neon-glow-blue scale-105'
                  : 'glass-card text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚀</span>
                <div className="text-left">
                  <div className="font-['Orbitron']">Neon Sky Runner</div>
                  <div className="text-xs opacity-75">Endless Runner</div>
                </div>
              </div>
            </button>
            <button
              onClick={() => setSelectedGame('tilenova')}
              className={`px-8 py-4 rounded-xl font-bold transition-all ${
                selectedGame === 'tilenova'
                  ? 'plasma-gradient text-white neon-glow-pink scale-105'
                  : 'glass-card text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div className="text-left">
                  <div className="font-['Orbitron']">TileNova</div>
                  <div className="text-xs opacity-75">Puzzle Strategy</div>
                </div>
              </div>
            </button>
          </div>

          {/* Leaderboard */}
          <div className="max-w-5xl mx-auto">
            {loading ? (
              <div className="text-center py-24">
                <div className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-xl text-gray-400">Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="glass-card p-16 text-center">
                <Trophy className="w-20 h-20 text-gray-500 mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4 text-white">No Scores Yet</h3>
                <p className="text-gray-400 mb-8">Be the first to set a high score!</p>
                <a
                  href={`/play/${selectedGame}`}
                  className="inline-flex items-center gap-2 cyber-gradient px-8 py-4 rounded-xl text-white font-bold hover:scale-105 transition-transform"
                >
                  <Zap className="w-5 h-5" />
                  <span>Play Now</span>
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`glass-card p-6 flex items-center justify-between hover:bg-white/10 transition-all group ${
                      index < 3 ? 'border-2 border-yellow-500/30' : ''
                    } ${index === 0 ? 'scale-105 shadow-2xl' : ''}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 flex items-center justify-center">
                        {getRankDisplay(entry.rank)}
                      </div>
                      <div>
                        <div className="font-mono text-lg text-white font-bold group-hover:text-cyan-400 transition-colors">
                          {formatAddress(entry.walletAddress)}
                        </div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <span>{entry.duration}s</span>
                          <span>•</span>
                          <span>{Math.round(entry.score / entry.duration)}/s</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-['Orbitron'] font-bold gradient-text">
                        {entry.score.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 uppercase tracking-wide">points</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Banner */}
            {!loading && leaderboard.length > 0 && (
              <div className="mt-12 p-6 rounded-xl glass-card border border-cyan-500/20">
                <div className="flex items-start gap-4">
                  <Award className="w-6 h-6 text-cyan-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-white mb-2">How Rankings Work</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      All scores are verified on-chain with anti-cheat protection. Only your highest score counts for ranking. 
                      Play consistently to maintain your position!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
