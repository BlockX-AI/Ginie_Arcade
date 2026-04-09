'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Flame, Calendar, ExternalLink, Zap, Trophy, Gamepad2, Shield } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const newsItems = [
  {
    id: 1,
    title: 'Ginix Arcade Launches on Avalanche Fuji Testnet',
    summary: 'The premier Web3 arcade gaming platform goes live with 4 games, on-chain scoring, and NFT achievements.',
    date: '2026-02-20',
    category: 'Launch',
    icon: Zap,
    hot: true,
  },
  {
    id: 2,
    title: 'New Game: TileNova Circuit Surge Now Available',
    summary: 'Master the grid in this electrifying puzzle game. Match circuits, create chains, and surge your way to victory.',
    date: '2026-02-18',
    category: 'New Game',
    icon: Gamepad2,
    hot: true,
  },
  {
    id: 3,
    title: 'Leaderboard Season 1 Begins — 10,000 AVAX Prize Pool',
    summary: 'Compete across all games for the top spots. Season 1 runs for 30 days with daily and weekly prizes.',
    date: '2026-02-15',
    category: 'Tournament',
    icon: Trophy,
    hot: false,
  },
  {
    id: 4,
    title: 'Anti-Cheat System v2.0 Deployed',
    summary: 'Enhanced server-side score validation with machine learning anomaly detection and improved rate limiting.',
    date: '2026-02-12',
    category: 'Technical',
    icon: Shield,
    hot: false,
  },
  {
    id: 5,
    title: 'NFT Achievement Badges: Platinum Tier Unlocked',
    summary: 'Reach level 50 to unlock the exclusive Platinum achievement badge, now mintable as an NFT on Avalanche.',
    date: '2026-02-08',
    category: 'Feature',
    icon: Zap,
    hot: false,
  },
  {
    id: 6,
    title: 'Community Tournament: Neon Sky Runner Challenge',
    summary: 'This weekend only — compete in the Neon Sky Runner speed challenge. Top 10 players win exclusive badges.',
    date: '2026-02-05',
    category: 'Event',
    icon: Trophy,
    hot: false,
  },
  {
    id: 7,
    title: 'Developer API Now Open for Game Submissions',
    summary: 'Game developers can now submit their arcade games for review. Accepted games get on-chain scoring integration.',
    date: '2026-02-01',
    category: 'Platform',
    icon: Gamepad2,
    hot: false,
  },
  {
    id: 8,
    title: 'Wallet Connect Issues Resolved',
    summary: 'Fixed an issue where some users experienced connection drops with MetaMask on mobile. Update your browser for best experience.',
    date: '2026-01-28',
    category: 'Fix',
    icon: Shield,
    hot: false,
  },
];

export default function NewsPage() {
  const pageRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const categories = useMemo(() => {
    const set = new Set<string>();
    newsItems.forEach((n) => set.add(n.category));
    return ['All', ...Array.from(set)];
  }, []);

  const [activeCategory, setActiveCategory] = useState('All');
  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return newsItems;
    return newsItems.filter((n) => n.category === activeCategory);
  }, [activeCategory]);

  useGSAP(
    () => {
      gsap.from('.news-anim-in', {
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
    if (!listRef.current) return;
    gsap.killTweensOf(listRef.current);
    gsap.fromTo(
      listRef.current.querySelectorAll('.news-row'),
      { y: 10, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.42,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'transform,opacity',
      }
    );
  }, [activeCategory]);

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-bg">
          <img src="/img/breadcrumb.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        </div>
        <div className="news-anim-in relative z-10 container mx-auto px-6 md:px-10 text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-crimson">News & Updates</p>
          <h1 className="mt-4 font-zentry text-5xl font-black uppercase text-white md:text-7xl">
            Ar<b className="text-crimson">c</b>ade <b className="text-crimson">N</b>ews
          </h1>
          <p className="mt-4 max-w-lg mx-auto font-circular-web text-white/50">
            Latest announcements, updates, and events from the Ginix Arcade platform.
          </p>
        </div>
      </div>

      {/* Breaking / Hot News */}
      <div className="container mx-auto px-6 md:px-10 py-12">
        <div className="news-anim-in flex items-center gap-2 mb-8">
          <Flame className="h-5 w-5 text-crimson animate-pulse" />
          <h2 className="font-zentry text-xl font-bold uppercase text-white">Breaking News</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {newsItems.filter(n => n.hot).map((item) => (
            <div key={item.id} className="news-anim-in group relative overflow-hidden rounded-xl border border-crimson/20 bg-gradient-to-br from-crimson/10 via-black to-black p-6 md:p-8 transition-all hover:border-crimson/40">
              <div className="absolute top-0 right-0 w-32 h-32 bg-crimson/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-crimson/10 border border-crimson/20">
                    <item.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span className="rounded-full bg-crimson/20 border border-crimson/30 px-2 py-0.5 text-[9px] font-general uppercase tracking-wider text-crimson">
                      {item.category}
                    </span>
                    <p className="text-[10px] text-white/30 mt-1">{item.date}</p>
                  </div>
                </div>
                <h3 className="font-zentry text-xl font-bold uppercase text-white leading-tight group-hover:text-crimson transition-colors">
                  {item.title}
                </h3>
                <p className="mt-3 font-circular-web text-sm text-white/50 leading-relaxed">{item.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All News */}
      <div className="container mx-auto px-6 md:px-10 pb-28">
        <div className="news-anim-in flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
          <div>
            <h2 className="font-zentry text-xl font-bold uppercase text-white">All Updates</h2>
            <p className="mt-1 font-circular-web text-sm text-white/35">
              Announcements, tournaments, fixes, and platform releases.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-robert-medium uppercase tracking-wider border transition-all ${
                  activeCategory === cat
                    ? 'border-crimson/30 bg-crimson/10 text-crimson'
                    : 'border-white/10 bg-white/[0.02] text-white/35 hover:border-white/20 hover:text-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-gradient-to-b from-crimson/40 via-white/10 to-transparent" />
          <div ref={listRef} className="space-y-3">
            {filteredItems.map((item) => (
              <div key={item.id} className="news-row relative pl-12">
                <div className={`absolute left-[11px] top-6 h-2.5 w-2.5 rounded-full ${item.hot ? 'bg-crimson' : 'bg-white/15'}`} />
                <div className="group flex items-start gap-5 rounded-xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-crimson/20 hover:bg-crimson/[0.03]">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 group-hover:text-crimson group-hover:border-crimson/20 transition-colors">
                    <item.icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[9px] font-general uppercase tracking-wider text-white/40 group-hover:border-crimson/20 group-hover:text-crimson transition-colors">
                        {item.category}
                      </span>
                      {item.hot && <Flame className="h-3 w-3 text-crimson" />}
                    </div>
                    <h3 className="font-zentry text-lg font-bold uppercase text-white group-hover:text-crimson transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-2 font-circular-web text-sm text-white/40 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[10px] text-white/20 pt-1">
                    <Calendar className="h-3 w-3" />
                    {item.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
