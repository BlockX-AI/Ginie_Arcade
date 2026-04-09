'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { TiLocationArrow } from 'react-icons/ti';
import { Search, Filter, Gamepad2, X } from 'lucide-react';

import AnimatedTitle from '@/components/animated-title';
import { GameCard } from '@/components/game-card';
import { games } from '@/lib/games';
import BentoTilt from '@/components/bento-tilt';

gsap.registerPlugin(ScrollTrigger);

const categories = ['All', 'Endless Runner', 'Puzzle', 'Arcade'];

export default function LibraryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const deferredQuery = useDeferredValue(searchQuery);
  const pageRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from('.lib-anim-in', {
        y: 16,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.08,
        clearProps: 'transform,opacity',
      });

      if (!gridRef.current) return;

      ScrollTrigger.create({
        trigger: gridRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const cards = gridRef.current?.querySelectorAll('.library-card');
          if (!cards || cards.length === 0) return;
          gsap.fromTo(
            cards,
            { y: 18, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              ease: 'power2.out',
              stagger: 0.06,
              clearProps: 'transform,opacity',
            }
          );
        },
      });
    },
    { scope: pageRef }
  );

  const filteredGames = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return games.filter((game) => {
      const matchesSearch =
        q.length === 0 ||
        game.title.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q);
      const matchesCategory = activeCategory === 'All' || game.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activeCategory, deferredQuery]);

  useEffect(() => {
    if (!gridRef.current) return;
    gsap.killTweensOf(gridRef.current);
    gsap.fromTo(
      gridRef.current.querySelectorAll('.library-card'),
      { y: 10, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.04,
        clearProps: 'transform,opacity',
      }
    );
  }, [activeCategory, deferredQuery]);

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      {/* Hero Header */}
      <div ref={headerRef} className="relative overflow-hidden pt-32 pb-20">
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src="/img/breadcrumb.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black" />
        </div>

        <div className="lib-anim-in relative z-10 container mx-auto px-5 md:px-10">
          <div className="flex flex-col items-center text-center">
            <p className="font-general text-sm uppercase text-off-white/60 md:text-[10px]">
              Game Library
            </p>
            <AnimatedTitle
              title="Ch<b>o</b>ose Your <br /> B<b>a</b>ttlefield"
              containerClass="mt-5 !text-white"
            />
            <p className="mt-5 max-w-lg font-circular-web text-off-white/50">
              Browse our complete collection of blockchain-powered arcade games.
              Every score verified on-chain, every achievement an NFT.
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="container mx-auto px-5 md:px-10 -mt-8 relative z-20">
        <div className="lib-anim-in flex flex-col gap-5 md:flex-row md:items-center md:justify-between rounded-2xl border border-white/10 bg-black/80 backdrop-blur-md p-5">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full bg-white/5 border border-white/10 pl-10 pr-10 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-crimson/50 focus:outline-none focus:ring-1 focus:ring-crimson/30 transition-colors"
            />
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="h-4 w-4 text-white/30 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-robert-medium uppercase tracking-wider transition-all duration-300 ${
                  activeCategory === cat
                    ? 'bg-crimson text-white'
                    : 'bg-white/5 text-white/50 border border-white/10 hover:border-crimson/30 hover:text-crimson'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden md:block text-right">
            <p className="font-mono text-[10px] text-white/25">
              {filteredGames.length} games
            </p>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="container mx-auto px-5 md:px-10 py-16">
        {filteredGames.length > 0 ? (
          <div ref={gridRef} className="library-grid grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGames.map((game, i) => (
              <div key={game.id} className="library-card">
                <GameCard game={game} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <Gamepad2 className="h-16 w-16 text-white/10 mb-5" />
            <h3 className="font-zentry text-2xl uppercase text-white/40">
              No Games Found
            </h3>
            <p className="mt-2 font-circular-web text-sm text-white/25">
              Try adjusting your search or filter criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('All');
              }}
              className="mt-6 rounded-full border border-crimson/30 bg-crimson/10 px-6 py-2 text-xs font-robert-medium uppercase text-crimson hover:bg-crimson hover:text-white transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Featured Highlight Section */}
      <div className="container mx-auto px-5 md:px-10 pb-28">
        <div className="grid grid-cols-1 gap-7 md:grid-cols-2">
          <BentoTilt className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 min-h-[300px]">
            <div className="absolute inset-0">
              <video
                src="/videos/feature-1.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="size-full object-cover opacity-40"
              />
            </div>
            <div className="relative z-10 flex size-full flex-col justify-end p-8">
              <p className="font-general text-[10px] uppercase text-crimson tracking-widest">
                Featured
              </p>
              <h3 className="mt-2 font-zentry text-3xl uppercase text-white md:text-4xl">
                Neon Sky Runner
              </h3>
              <p className="mt-2 max-w-sm font-circular-web text-sm text-white/50">
                Our most popular game. Race through neon-lit skies and compete
                for the highest on-chain score.
              </p>
              <Link
                href="/play/neon-sky-runner"
                className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-crimson px-6 py-2.5 text-xs font-robert-medium uppercase text-white hover:bg-electric-red transition-colors"
              >
                <TiLocationArrow className="text-base" />
                Play Now
              </Link>
            </div>
          </BentoTilt>

          <div className="grid grid-rows-2 gap-7">
            <BentoTilt className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              <div className="absolute inset-0">
                <video
                  src="/videos/feature-3.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="size-full object-cover opacity-30"
                />
              </div>
              <div className="relative z-10 flex size-full flex-col justify-end p-6">
                <h4 className="font-zentry text-xl uppercase text-white">
                  Coming Soon
                </h4>
                <p className="mt-1 font-circular-web text-xs text-white/40">
                  New games are being developed. Stay tuned for multiplayer
                  battles and tournament modes.
                </p>
              </div>
            </BentoTilt>

            <BentoTilt className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-crimson/20 via-black to-dark-red/20">
              <div className="flex size-full flex-col items-center justify-center p-6 text-center">
                <h4 className="font-zentry text-xl uppercase text-white">
                  Submit Your Game
                </h4>
                <p className="mt-2 max-w-xs font-circular-web text-xs text-white/40">
                  Are you a game developer? Submit your arcade game to be
                  featured on the Ginix Arcade platform.
                </p>
                <Link
                  href="/contact"
                  className="mt-4 rounded-full border border-crimson/30 bg-crimson/10 px-5 py-2 text-xs font-robert-medium uppercase text-crimson hover:bg-crimson hover:text-white transition-all"
                >
                  Contact Us
                </Link>
              </div>
            </BentoTilt>
          </div>
        </div>
      </div>
    </main>
  );
}
