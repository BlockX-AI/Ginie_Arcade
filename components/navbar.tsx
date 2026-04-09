'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Droplets, Menu, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import gsap from 'gsap';
import { useWindowScroll } from 'react-use';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/library', label: 'Library' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/blog', label: 'Blog' },
  { href: '/news', label: 'News' },
  { href: '/contact', label: 'Contact' },
];

export function Navbar() {
  const pathname = usePathname();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isIndicatorActive, setIsIndicatorActive] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);
  const [hasAutoPlayed, setHasAutoPlayed] = useState(false);

  const BASE_VOLUME = 0.45;

  const navContainerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const pausedByGameRef = useRef(false);
  const wasPlayingBeforeGameRef = useRef(false);
  const { isConnected } = useAccount();
  const { y: currentScrollY } = useWindowScroll();

  // Create audio element once on mount with smooth loop crossfade
  useEffect(() => {
    const persistedEnabled = window.localStorage.getItem('ginix_audio_enabled') === '1';
    const audio = new Audio('/audio/loop.mp3');
    audio.loop = true;
    audio.volume = BASE_VOLUME;
    audio.preload = 'auto';
    audio.muted = !persistedEnabled;
    audioElementRef.current = audio;

    // Smooth loop transition - fade out before end, fade in at start
    const handleTimeUpdate = () => {
      if (!audio.duration) return;
      const fadeTime = 0.8; // seconds before end to start fade
      const timeLeft = audio.duration - audio.currentTime;

      if (timeLeft <= fadeTime && timeLeft > 0) {
        // Fade out smoothly
        audio.volume = Math.max(0, (timeLeft / fadeTime) * BASE_VOLUME);
      } else if (audio.currentTime < fadeTime) {
        // Fade in at the start
        audio.volume = Math.min(BASE_VOLUME, (audio.currentTime / fadeTime) * BASE_VOLUME);
      } else {
        // Normal volume
        audio.volume = BASE_VOLUME;
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    audio.play().then(() => {
      if (persistedEnabled) {
        setIsAudioPlaying(true);
        setIsIndicatorActive(true);
        setHasAutoPlayed(true);
      }
    }).catch(() => {
      audio.muted = true;
      audio.play().catch(() => {});
    });
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.pause();
      audio.src = '';
    };
  }, []);

  // Auto-play audio on first user interaction
  useEffect(() => {
    if (hasAutoPlayed) return;

    const startAudio = () => {
      const audio = audioElementRef.current;
      if (!audio) return;
      audio.muted = false;
      audio.volume = BASE_VOLUME;
      audio.play().then(() => {
        setIsAudioPlaying(true);
        setIsIndicatorActive(true);
        setHasAutoPlayed(true);
        window.localStorage.setItem('ginix_audio_enabled', '1');
      }).catch(() => {});
    };

    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('touchstart', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    window.addEventListener('scroll', startAudio, { once: true, passive: true });

    return () => {
      window.removeEventListener('click', startAudio);
      window.removeEventListener('touchstart', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('scroll', startAudio);
    };
  }, [hasAutoPlayed]);

  // Allow game pages to temporarily pause/resume the site background music
  useEffect(() => {
    const onPause = () => {
      const audio = audioElementRef.current;
      if (!audio) return;
      if (pausedByGameRef.current) return;

      wasPlayingBeforeGameRef.current = isAudioPlaying;
      pausedByGameRef.current = true;

      if (!audio.paused) {
        audio.pause();
      }
      setIsAudioPlaying(false);
      setIsIndicatorActive(false);
    };

    const onResume = () => {
      const audio = audioElementRef.current;
      if (!audio) return;
      if (!pausedByGameRef.current) return;

      pausedByGameRef.current = false;
      if (!wasPlayingBeforeGameRef.current) return;

      audio.muted = false;
      audio.volume = BASE_VOLUME;
      audio.play().then(() => {
        setIsAudioPlaying(true);
        setIsIndicatorActive(true);
      }).catch(() => {});
    };

    window.addEventListener('ginix:pause-audio', onPause);
    window.addEventListener('ginix:resume-audio', onResume);
    return () => {
      window.removeEventListener('ginix:pause-audio', onPause);
      window.removeEventListener('ginix:resume-audio', onResume);
    };
  }, [isAudioPlaying]);

  useEffect(() => {
    if (currentScrollY === 0) {
      setIsNavVisible(true);
    } else if (currentScrollY > lastScrollY) {
      setIsNavVisible(false);
    } else if (currentScrollY < lastScrollY) {
      setIsNavVisible(true);
    }
    setLastScrollY(currentScrollY);
  }, [currentScrollY, lastScrollY]);

  useEffect(() => {
    gsap.to(navContainerRef.current, {
      y: isNavVisible ? 0 : -100,
      opacity: isNavVisible ? 1 : 0,
      duration: 0.4,
      ease: 'power2.out',
    });
  }, [isNavVisible]);

  const toggleAudio = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
      setIsAudioPlaying(false);
      setIsIndicatorActive(false);
      window.localStorage.setItem('ginix_audio_enabled', '0');
    } else {
      audio.muted = false;
      audio.volume = BASE_VOLUME;
      audio.play().then(() => {
        setIsAudioPlaying(true);
        setIsIndicatorActive(true);
        setHasAutoPlayed(true);
        window.localStorage.setItem('ginix_audio_enabled', '1');
      }).catch(() => {});
    }
  }, [isAudioPlaying]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <div
      ref={navContainerRef}
      className="fixed inset-x-0 top-0 z-50 min-h-16 transition-all duration-500 sm:inset-x-4 sm:top-3 md:inset-x-6 md:top-4 rounded-none sm:rounded-2xl floating-nav"
    >
      {/* Crimson accent line at bottom */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-1/3 bg-gradient-to-r from-transparent via-crimson/40 to-transparent" />

      <header className="w-full">
        <nav className="flex min-h-16 w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-crimson/20 to-dark-red/10 border border-crimson/30 group-hover:from-crimson/30 group-hover:to-dark-red/20 group-hover:border-crimson/50 transition-all duration-300 shadow-lg shadow-crimson/10">
                <img
                  src="/Ginie.ico"
                  alt="Ginie"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <span className="font-zentry text-lg font-bold tracking-wide sm:text-xl md:text-2xl whitespace-nowrap leading-none">
                <span className="text-crimson">GINIX</span>
                <span className="text-white"> ARCADE</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'relative px-3 py-2 font-general text-[10px] uppercase tracking-widest transition-all duration-300 rounded-lg',
                  isActive(link.href)
                    ? 'text-crimson bg-crimson/10 shadow-inner shadow-crimson/5'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 bg-crimson rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Open menu"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-white/10 bg-black/95 backdrop-blur-xl text-white w-72"
              >
                <SheetHeader className="text-left">
                  <SheetTitle className="font-zentry text-2xl uppercase text-white">
                    <span className="text-crimson">Ginix</span> Arcade
                  </SheetTitle>
                </SheetHeader>

                <div className="mt-8 grid gap-1">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'rounded-lg px-3 py-2.5 font-general text-xs uppercase tracking-wider transition-colors',
                          isActive(link.href)
                            ? 'text-crimson bg-crimson/5 border-l-2 border-crimson'
                            : 'text-white/60 hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                        )}
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                <div className="mt-8 grid gap-3">
                  <div className="w-full">
                    <ConnectButton
                      chainStatus="icon"
                      showBalance={false}
                      accountStatus={{
                        smallScreen: 'full',
                        largeScreen: 'full',
                      }}
                    />
                  </div>

                  {isConnected && (
                    <a
                      href="https://core.app/tools/testnet-faucet/?subnet=c&token=c"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-crimson/20 bg-crimson/5 px-4 py-2.5 text-xs font-medium text-crimson hover:bg-crimson/10 transition-colors"
                    >
                      <Droplets className="h-4 w-4" />
                      Get Test AVAX
                    </a>
                  )}

                  <button
                    onClick={toggleAudio}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-2.5"
                    aria-label="Toggle audio"
                  >
                    <span className="font-general text-[10px] uppercase tracking-wider text-white/50">
                      {isAudioPlaying ? 'Audio On' : 'Audio Off'}
                    </span>
                    {isAudioPlaying ? (
                      <Volume2 className="h-4 w-4 text-crimson" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-white/30" />
                    )}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right side: Wallet + Audio */}
          <div className="flex items-center gap-2">
            {isConnected && (
              <a
                href="https://core.app/tools/testnet-faucet/?subnet=c&token=c"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-general uppercase tracking-wider text-crimson border border-crimson/20 rounded-lg hover:bg-crimson/10 transition-colors"
              >
                <Droplets className="w-3 h-3" />
                Faucet
              </a>
            )}

            <div className="block">
              <ConnectButton
                chainStatus="icon"
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleAudio}
              className={cn(
                'ml-1 flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-300',
                isAudioPlaying
                  ? 'border-crimson/30 bg-crimson/10 text-crimson'
                  : 'border-white/10 bg-white/5 text-white/30 hover:text-white/60'
              )}
              aria-label="Toggle audio"
            >
              {isAudioPlaying ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
            </button>

            {/* Audio indicator bars */}
            <div className="hidden sm:flex items-center space-x-0.5 ml-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={cn(
                    'indicator-line',
                    isIndicatorActive ? 'active' : ''
                  )}
                  style={{ animationDelay: `${bar * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        </nav>
      </header>
    </div>
  );
}
