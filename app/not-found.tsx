'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Home, Gamepad2, ArrowLeft } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function NotFound() {
  const [glitchActive, setGlitchActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 200);
    }, 3000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useGSAP(
    () => {
      gsap.from('.nf-anim-in', {
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

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-hidden bg-black flex items-center justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-crimson/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-dark-red/5 rounded-full blur-[150px]" />
        {/* Scan lines */}
        <div className="absolute inset-0 scan-overlay" />
        {/* Grid pattern */}
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        {/* Glitch 404 */}
        <div className="nf-anim-in relative mb-8">
          <h1
            className={`font-zentry text-[10rem] font-black leading-none text-white/5 md:text-[14rem] select-none ${
              glitchActive ? 'animate-glitch-after' : ''
            }`}
          >
            404
          </h1>
          {/* Overlay text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="font-zentry text-[10rem] font-black leading-none text-transparent md:text-[14rem] bg-clip-text bg-gradient-to-b from-crimson/60 via-crimson/20 to-transparent select-none">
              404
            </h2>
          </div>
          {/* Glitch layers */}
          {glitchActive && (
            <>
              <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{ transform: 'translate(-4px, 2px)' }}>
                <span className="font-zentry text-[10rem] font-black leading-none text-crimson/40 md:text-[14rem]" style={{ clipPath: 'inset(20% 0 50% 0)' }}>404</span>
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-70" style={{ transform: 'translate(4px, -2px)' }}>
                <span className="font-zentry text-[10rem] font-black leading-none text-electric-red/30 md:text-[14rem]" style={{ clipPath: 'inset(60% 0 10% 0)' }}>404</span>
              </div>
            </>
          )}
        </div>

        {/* Message */}
        <div className="nf-anim-in mb-10">
          <p className="font-general text-[10px] uppercase tracking-[0.3em] text-crimson mb-3">
            Page Not Found
          </p>
          <h3 className="font-zentry text-3xl font-bold uppercase text-white md:text-4xl">
            You&apos;ve Wandered Off the Map
          </h3>
          <p className="mt-4 font-circular-web text-sm text-white/40 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Return to the arcade and get back in the game.
          </p>
        </div>

        {/* Actions */}
        <div className="nf-anim-in flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-xs font-robert-medium uppercase tracking-wider text-white hover:bg-electric-red transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3 text-xs font-robert-medium uppercase tracking-wider text-white/70 hover:border-crimson/30 hover:text-white transition-all"
          >
            <Gamepad2 className="h-4 w-4" />
            Game Library
          </Link>
        </div>

        {/* Decorative terminal */}
        <div className="nf-anim-in mt-16 mx-auto max-w-sm rounded-lg border border-white/5 bg-white/[0.02] p-4 text-left">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="h-2 w-2 rounded-full bg-crimson/60" />
            <div className="h-2 w-2 rounded-full bg-gold/40" />
            <div className="h-2 w-2 rounded-full bg-green-500/40" />
          </div>
          <div className="font-mono text-[10px] text-white/20 space-y-1">
            <p><span className="text-crimson/50">$</span> navigate /unknown-route</p>
            <p><span className="text-crimson">error:</span> route not found in arcade registry</p>
            <p><span className="text-white/30">suggestion:</span> try /library or /leaderboard</p>
            <p className="animate-pulse">
              <span className="text-crimson/50">$</span> <span className="text-white/30">_</span>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
