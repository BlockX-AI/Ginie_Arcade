'use client';

import { useAccount, useReadContract } from 'wagmi';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Trophy, Zap, Target, Award, TrendingUp, Calendar } from 'lucide-react';
import { CONTRACTS, CORE_ABI, gameIdToBytes32 } from '@/lib/contracts';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const router = useRouter();

  // Read player data from Core contract
  const { data: playerData } = useReadContract({
    address: CONTRACTS.core,
    abi: CORE_ABI,
    functionName: 'getPlayerData',
    args: address ? [address] : undefined,
  });

  // Read high scores
  const { data: neonScore } = useReadContract({
    address: CONTRACTS.core,
    abi: CORE_ABI,
    functionName: 'getHighScore',
    args: address ? [address, gameIdToBytes32('neon-sky-runner')] : undefined,
  });

  const { data: tilenovaScore } = useReadContract({
    address: CONTRACTS.core,
    abi: CORE_ABI,
    functionName: 'getHighScore',
    args: address ? [address, gameIdToBytes32('tilenova')] : undefined,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="glass-card p-12 text-center max-w-md">
            <div className="w-20 h-20 rounded-full cyber-gradient flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-4 gradient-text">Connect Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to view your player dashboard and on-chain stats</p>
            <button
              onClick={() => router.push('/')}
              className="cyber-gradient px-8 py-4 rounded-xl text-white font-bold"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const xp = playerData ? Number((playerData as any)[0] || 0) : 0;
  const sessions = playerData ? Number((playerData as any)[1] || 0) : 0;
  const level = playerData ? Number((playerData as any)[2] || 1) : 1;
  const neonHighScore = neonScore ? Number(neonScore) : 0;
  const tilenovaHighScore = tilenovaScore ? Number(tilenovaScore) : 0;

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-32 pb-20 px-4">
        <div className="section-container">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">
              <span className="gradient-text font-['Orbitron']">DASHBOARD</span>
            </h1>
            <p className="text-gray-400 text-xl">Your on-chain gaming profile</p>
          </div>

          {/* Stats Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <div className="glass-card p-6 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl cyber-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total XP</p>
                  <p className="text-3xl font-bold font-['Orbitron'] gradient-text">{xp.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-1 rounded-full bg-white/10">
                <div className="h-full rounded-full cyber-gradient" style={{ width: `${Math.min(100, (xp / 1000) * 100)}%` }}></div>
              </div>
            </div>

            <div className="glass-card p-6 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl plasma-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Level</p>
                  <p className="text-3xl font-bold font-['Orbitron'] text-white">{level}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Next: Level {level + 1}</p>
            </div>

            <div className="glass-card p-6 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl quantum-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Sessions</p>
                  <p className="text-3xl font-bold font-['Orbitron'] text-white">{sessions}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Games played</p>
            </div>

            <div className="glass-card p-6 hover:bg-white/10 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Award className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Achievements</p>
                  <p className="text-3xl font-bold font-['Orbitron'] text-white">0</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">Unlocked</p>
            </div>
          </div>

          {/* High Scores */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 gradient-text font-['Orbitron']">HIGH SCORES</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-card p-8 relative overflow-hidden group hover:bg-white/10 transition-all">
                <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Neon Sky Runner</h3>
                    <div className="text-4xl">🚀</div>
                  </div>
                  <div className="text-5xl font-['Orbitron'] gradient-text mb-2">
                    {neonHighScore.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400">Personal best on-chain</p>
                </div>
              </div>

              <div className="glass-card p-8 relative overflow-hidden group hover:bg-white/10 transition-all">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">TileNova</h3>
                    <div className="text-4xl">⚡</div>
                  </div>
                  <div className="text-5xl font-['Orbitron'] gradient-text mb-2">
                    {tilenovaHighScore.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-400">Personal best on-chain</p>
                </div>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="glass-card p-10 mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold gradient-text font-['Orbitron']">LEVEL PROGRESS</h2>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-bold">{xp % 100}% to next level</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-6xl font-['Orbitron'] gradient-text">{level}</div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-400">Level {level}</span>
                  <span className="text-sm text-gray-400">Level {level + 1}</span>
                </div>
                <div className="h-4 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full cyber-gradient neon-glow-blue transition-all duration-1000"
                    style={{ width: `${(xp % 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{xp} XP</span>
                  <span className="text-xs text-gray-500">{Math.ceil(xp / 100) * 100} XP</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
              <p className="text-sm text-gray-300">
                <span className="font-bold text-cyan-400">💡 Pro Tip:</span> Earn 100 XP per level. Play more games and achieve milestones to level up faster!
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6">
            <button
              onClick={() => router.push('/')}
              className="glass-card p-6 hover:bg-white/10 transition-all text-left group"
            >
              <Zap className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2 text-white">Play More Games</h3>
              <p className="text-sm text-gray-400">Continue earning XP and rewards</p>
            </button>

            <button
              onClick={() => router.push('/leaderboard')}
              className="glass-card p-6 hover:bg-white/10 transition-all text-left group"
            >
              <Trophy className="w-8 h-8 text-yellow-400 mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold mb-2 text-white">View Leaderboard</h3>
              <p className="text-sm text-gray-400">See how you rank against others</p>
            </button>

            <div className="glass-card p-6 opacity-50">
              <Calendar className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-bold mb-2 text-white">Quest System</h3>
              <p className="text-sm text-gray-400">Coming soon...</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
