'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { GameCard } from '@/components/game/GameCard';
import { Zap, Shield, Trophy, Gamepad2, TrendingUp, Lock, Coins, Sparkles, ArrowRight, Star } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black via-gray-900/50 to-black"></div>
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[150px] animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[700px] h-[700px] bg-purple-500/10 rounded-full blur-[180px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-pink-500/5 rounded-full blur-[200px] animate-float"></div>
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
      </div>

      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-32 px-4 overflow-hidden">
        <div className="section-container relative z-10">
          <div className="max-w-6xl mx-auto text-center space-y-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-card-hover border-2 border-cyan-500/40 backdrop-blur-xl animate-fade-in shadow-2xl">
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-sm text-cyan-300 font-['Orbitron'] font-bold tracking-wider">POWERED BY AVALANCHE BLOCKCHAIN</span>
              <Star className="w-4 h-4 text-yellow-400 animate-pulse" />
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black leading-[1.1] animate-fade-in-up tracking-tight">
              <span className="block text-white font-['Orbitron'] mb-4">PLAY. EARN.</span>
              <span className="block gradient-text font-['Orbitron'] drop-shadow-[0_0_50px_rgba(0,217,255,0.5)]">DOMINATE.</span>
            </h1>

            {/* Description */}
            <p className="text-xl md:text-3xl text-gray-200 max-w-4xl mx-auto leading-relaxed animate-fade-in-up font-light" style={{ animationDelay: '0.2s' }}>
              The <span className="text-cyan-400 font-bold bg-cyan-500/10 px-2 rounded">first truly decentralized</span> arcade platform where every achievement is
              <span className="text-purple-400 font-bold bg-purple-500/10 px-2 rounded ml-2">verifiable on-chain</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <a
                href="#games"
                className="group cyber-gradient px-12 py-6 rounded-2xl font-bold text-white neon-glow-blue hover:scale-110 hover:rotate-1 transition-all duration-300 inline-flex items-center gap-4 shadow-[0_0_50px_rgba(0,217,255,0.3)] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <Gamepad2 className="w-7 h-7 relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="font-['Orbitron'] text-xl relative z-10 tracking-wide">START PLAYING</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" />
              </a>
              <a
                href="#how-it-works"
                className="group px-12 py-6 rounded-2xl font-bold text-white glass-card-hover border-2 border-white/20 hover:border-purple-500/50 transition-all duration-300 inline-flex items-center gap-4 hover:scale-105"
              >
                <TrendingUp className="w-7 h-7 text-purple-400 group-hover:rotate-12 transition-transform" />
                <span className="font-['Orbitron'] text-xl tracking-wide">HOW IT WORKS</span>
              </a>
            </div>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              {[
                { icon: Shield, text: 'Anti-Cheat Protected', color: 'cyan' },
                { icon: Trophy, text: 'On-Chain Rewards', color: 'purple' },
                { icon: Lock, text: 'Provably Fair', color: 'pink' },
                { icon: Coins, text: 'Real Earnings', color: 'yellow' },
              ].map((feature, i) => (
                <div key={i} className="group flex items-center gap-3 px-6 py-4 rounded-2xl glass-card-hover border border-white/10 hover:border-white/30 transition-all hover:-translate-y-1">
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400 group-hover:scale-125 transition-transform`} />
                  <span className="text-base font-semibold text-gray-200 group-hover:text-white transition-colors">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Games Showcase */}
      <section id="games" className="relative py-32 px-4 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
        <div className="section-container">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card border border-purple-500/30 mb-6">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-purple-300 font-['Orbitron'] font-bold">GAME LIBRARY</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black mb-8">
              <span className="gradient-text font-['Orbitron'] tracking-tight">CHOOSE YOUR GAME</span>
            </h2>
            <p className="text-gray-300 text-2xl max-w-3xl mx-auto font-light">
              Every game integrates directly with our smart contracts for
              <span className="text-cyan-400 font-semibold ml-2">instant rewards</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-10 max-w-7xl mx-auto">
            <GameCard
              id="neon-sky-runner"
              title="Neon Sky Runner"
              description="Race through neon skies in this endless runner. Dodge obstacles, collect stars, and climb the leaderboard."
              players={1847}
              highScore={8450}
              gradient="cyber"
              icon="🚀"
            />
            <GameCard
              id="tilenova"
              title="TileNova: Circuit Surge"
              description="Strategic puzzle game where you connect tiles to create circuits. Master combos for massive XP rewards."
              players={1523}
              highScore={12300}
              gradient="plasma"
              icon="⚡"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-32 px-4 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="section-container">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-card border border-cyan-500/30 mb-6">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-cyan-300 font-['Orbitron'] font-bold">SIMPLE PROCESS</span>
            </div>
            <h2 className="text-6xl md:text-7xl font-black mb-8">
              <span className="text-white font-['Orbitron']">HOW IT </span>
              <span className="gradient-text font-['Orbitron']">WORKS</span>
            </h2>
            <p className="text-gray-300 text-2xl font-light">Four simple steps to start earning blockchain rewards</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {[
              {
                num: '01',
                title: 'Connect Wallet',
                desc: 'Link your Web3 wallet to the Ginix Arcade platform',
                icon: '🔌',
                color: 'cyan',
              },
              {
                num: '02',
                title: 'Choose Game',
                desc: 'Select from our collection of blockchain-integrated games',
                icon: '🎮',
                color: 'purple',
              },
              {
                num: '03',
                title: 'Play & Earn',
                desc: 'Every score is recorded on-chain with anti-cheat protection',
                icon: '⚡',
                color: 'pink',
              },
              {
                num: '04',
                title: 'Claim Rewards',
                desc: 'Unlock achievements and claim XP rewards directly to your wallet',
                icon: '🏆',
                color: 'yellow',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="glass-card-hover p-10 text-center border-2 border-white/10 hover:border-white/30 transition-all duration-300 group relative overflow-hidden hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-${step.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10 space-y-4">
                  <div className="text-8xl mb-6 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300">{step.icon}</div>
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-${step.color}-500/20 border-2 border-${step.color}-500/40`}>
                    <span className={`text-lg text-${step.color}-400 font-['Orbitron'] font-black`}>{step.num}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-3 text-white font-['Orbitron'] tracking-wide">{step.title}</h3>
                  <p className="text-base text-gray-300 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Stats */}
      <section className="relative py-32 px-4 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent">
        <div className="section-container">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black mb-4">
              <span className="gradient-text font-['Orbitron']">PLATFORM STATS</span>
            </h2>
            <p className="text-gray-300 text-xl font-light">Real-time on-chain metrics</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {[
              { value: '2', label: 'Games Available', suffix: '', icon: '🎮', color: 'cyan' },
              { value: '3K+', label: 'Active Players', suffix: '', icon: '👥', color: 'purple' },
              { value: '50K+', label: 'Games Played', suffix: '', icon: '🎯', color: 'pink' },
              { value: '$10K+', label: 'Rewards Distributed', suffix: '', icon: '💰', color: 'yellow' },
            ].map((stat, i) => (
              <div key={i} className="group text-center glass-card-hover p-10 border-2 border-white/10 hover:border-white/30 transition-all hover:-translate-y-2 relative overflow-hidden">
                <div className={`absolute inset-0 bg-${stat.color}-500/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                <div className="relative z-10 space-y-3">
                  <div className="text-5xl mb-4 group-hover:scale-125 transition-transform">{stat.icon}</div>
                  <div className="text-7xl font-black gradient-text mb-2 font-['Orbitron'] tracking-tighter">{stat.value}</div>
                  <div className="text-gray-300 text-base font-semibold tracking-wide">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative py-32 px-4">
        <div className="section-container">
          <div className="max-w-5xl mx-auto text-center glass-card-hover p-16 relative overflow-hidden border-2 border-cyan-500/30 shadow-[0_0_100px_rgba(0,217,255,0.2)]">
            <div className="absolute inset-0 cyber-gradient opacity-5"></div>
            <div className="absolute top-0 left-0 w-full h-1 cyber-gradient"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 cyber-gradient"></div>
            <div className="relative z-10 space-y-8">
              <div className="text-6xl mb-6">🎮</div>
              <h2 className="text-5xl md:text-7xl font-black gradient-text font-['Orbitron'] mb-6 tracking-tight">
                READY TO DOMINATE?
              </h2>
              <p className="text-2xl text-gray-200 max-w-3xl mx-auto font-light leading-relaxed">
                Join <span className="text-cyan-400 font-bold">thousands of players</span> earning <span className="text-purple-400 font-bold">real blockchain rewards</span>
              </p>
              <div className="pt-4">
                <a
                  href="#games"
                  className="group inline-flex items-center gap-4 cyber-gradient px-14 py-7 rounded-2xl font-bold text-white neon-glow-blue hover:scale-110 transition-all duration-300 shadow-[0_0_60px_rgba(0,217,255,0.4)] relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Gamepad2 className="w-8 h-8 relative z-10 group-hover:rotate-12 transition-transform" />
                  <span className="font-['Orbitron'] text-2xl relative z-10 tracking-wide">START PLAYING NOW</span>
                  <ArrowRight className="w-7 h-7 relative z-10 group-hover:translate-x-2 transition-transform" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
