'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { TiLocationArrow } from 'react-icons/ti';

export default function HeroSection() {
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const fallback = window.setTimeout(() => setLoading(false), 2500);
    if (vid.readyState >= 2) setLoading(false);
    return () => window.clearTimeout(fallback);
  }, []);

  useGSAP(() => {
    const tl = gsap.timeline({ delay: 0.2 });
    tl.from('.hero-tag', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' })
      .from('.hero-title-word', { y: 100, opacity: 0, rotateX: -30, duration: 1.2, stagger: 0.12, ease: 'power4.out' }, '-=0.3')
      .from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.8, ease: 'power2.out' }, '-=0.5')
      .from('.hero-cta', { y: 25, opacity: 0, duration: 0.7, stagger: 0.1, ease: 'power2.out' }, '-=0.4')
      .from('.hero-stat', { y: 20, opacity: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out' }, '-=0.3')
      .from('.hero-scroll', { opacity: 0, duration: 0.8 }, '-=0.2');
  }, { scope: heroRef });

  return (
    <section ref={heroRef} className="relative h-dvh w-screen overflow-hidden bg-black">
      {/* Loading spinner */}
      {loading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black">
          <div className="three-body">
            <div className="three-body__dot" />
            <div className="three-body__dot" />
            <div className="three-body__dot" />
          </div>
        </div>
      )}

      {/* Background video */}
      <video
        ref={videoRef}
        src="/videos/hero-1.mp4"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        onLoadedData={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onError={() => setLoading(false)}
        className="absolute inset-0 size-full object-cover"
      />

      {/* Dark gradient overlays for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      {/* Scan line overlay for gaming feel */}
      <div className="absolute inset-0 scan-overlay pointer-events-none" />

      {/* Ambient glow orbs */}
      <div className="absolute top-1/4 right-1/4 w-80 h-80 bg-crimson/8 rounded-full blur-[120px] animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-60 h-60 bg-dark-red/10 rounded-full blur-[100px] animate-pulse-glow pointer-events-none" style={{ animationDelay: '1.5s' }} />

      {/* Grid pattern subtle overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-10 flex h-full flex-col justify-center px-8 pt-20 pb-20 sm:px-16 sm:pt-24 sm:pb-24 lg:px-24 lg:pt-28 lg:pb-24 [@media(max-height:750px)]:pt-16 [@media(max-height:750px)]:pb-16">
        <div className="max-w-3xl">
          {/* Tag line */}
          {/* <div className="hero-tag mb-6 inline-flex items-center gap-2 rounded-full border border-crimson/20 bg-crimson/5 px-4 py-1.5 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
            <span className="font-general text-[10px] uppercase tracking-[0.2em] text-crimson">Web3 Gaming Platform — Live on Avalanche</span>
          </div> */}

          {/* Title */}
          <div className="overflow-hidden" style={{ perspective: '800px' }}>
            <h1 className="hero-title-word font-zentry text-5xl font-black uppercase leading-[0.85] text-white sm:text-7xl lg:text-[9rem] [@media(max-height:750px)]:lg:text-[7.25rem]">
              G<b className="text-crimson">I</b>NIX
            </h1>
          </div>
          <div className="overflow-hidden mt-2" style={{ perspective: '800px' }}>
            <h1 className="hero-title-word font-zentry text-5xl font-black uppercase leading-[0.85] text-white sm:text-7xl lg:text-[9rem] [@media(max-height:750px)]:lg:text-[7.25rem]">
              ARCA<b className="text-crimson">D</b>E
            </h1>
          </div>

          {/* Subtitle */}
          <p className="hero-subtitle mt-6 max-w-xl font-circular-web text-base leading-relaxed text-white/70 sm:text-lg lg:text-xl [@media(max-height:750px)]:mt-4">
            The ultimate Web3 blockchain gaming arena. Connect your wallet,
            dominate the leaderboards, and earn NFT achievements in a
            blockchain-powered gaming universe.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-4 [@media(max-height:750px)]:mt-6">
            <Link
              href="/library"
              className="hero-cta group relative flex items-center gap-2 rounded-full bg-crimson px-8 py-4 font-general text-xs uppercase tracking-wider text-white transition-all duration-300 hover:bg-electric-red hover:shadow-[0_0_30px_rgba(220,20,60,0.4)] [@media(max-height:750px)]:py-3.5"
            >
              <TiLocationArrow className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
              Start Playing
            </Link>
            <Link
              href="/leaderboard"
              className="hero-cta flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-general text-xs uppercase tracking-wider text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-crimson/40 hover:bg-crimson/10 [@media(max-height:750px)]:py-3.5"
            >
              View Leaderboard
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-10 flex flex-wrap items-center gap-6 sm:gap-10 border-t border-white/10 pt-6 [@media(max-height:750px)]:mt-8 [@media(max-height:750px)]:pt-5">
            <div className="hero-stat">
              <p className="font-zentry text-3xl font-black text-white [@media(max-height:750px)]:text-2xl">30K+</p>
              <p className="mt-1 font-general text-[10px] uppercase tracking-widest text-white/40">Players</p>
            </div>
            <div className="hero-stat">
              <p className="font-zentry text-3xl font-black text-white [@media(max-height:750px)]:text-2xl">4</p>
              <p className="mt-1 font-general text-[10px] uppercase tracking-widest text-white/40">Games Live</p>
            </div>
            <div className="hero-stat">
              <p className="font-zentry text-3xl font-black text-white [@media(max-height:750px)]:text-2xl">2.1M</p>
              <p className="mt-1 font-general text-[10px] uppercase tracking-widest text-white/40">On-Chain Scores</p>
            </div>
            <div className="hero-stat hidden sm:block">
              <p className="font-zentry text-3xl font-black text-white [@media(max-height:750px)]:text-2xl">100%</p>
              <p className="mt-1 font-general text-[10px] uppercase tracking-widest text-white/40">On-Chain</p>
            </div>
          </div>
        </div>
      </div>

      {/* Side decoration line */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3 z-10 [@media(max-height:750px)]:hidden">
        <div className="h-16 w-px bg-gradient-to-b from-transparent via-crimson/40 to-transparent" />
        <span className="font-mono text-[9px] text-white/20 tracking-widest" style={{ writingMode: 'vertical-rl' }}>GINIX // 2026</span>
        <div className="h-16 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex flex-col items-center gap-2 [@media(max-height:750px)]:bottom-4">
        <p className="font-general text-[10px] uppercase tracking-[0.3em] text-white/30">Scroll</p>
        <div className="h-10 w-px bg-gradient-to-b from-white/30 to-transparent animate-pulse [@media(max-height:750px)]:h-8" />
      </div>
    </section>
  );
}
