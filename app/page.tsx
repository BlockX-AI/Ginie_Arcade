'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { TiLocationArrow } from 'react-icons/ti';
import { FaShieldAlt, FaTrophy, FaWallet, FaGamepad } from 'react-icons/fa';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import HeroSection from '@/components/hero-section';
import AnimatedTitle from '@/components/animated-title';
import BentoTilt from '@/components/bento-tilt';
import BentoCard from '@/components/bento-card';
import { GlanceCard } from '@/components/glance-stats';
import { GameCard } from '@/components/game-card';
import { games } from '@/lib/games';

/* ═══════════════════════════════════════════════════════
   ABOUT SECTION — Clean text + image layout
   ═══════════════════════════════════════════════════════ */
function AboutSection() {
  return (
    <section id="about" className="relative bg-black py-28">
      <div className="container mx-auto px-6 md:px-10">
        {/* Section header */}
        <div className="flex flex-col items-center text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-white/40">
            Welcome to Ginix Arcade
          </p>
          <AnimatedTitle
            title="The Ulti<b>m</b>ate Web3 <br /> G<b>a</b>ming Arena"
            containerClass="mt-5 !text-white text-center"
          />
          <p className="mt-6 max-w-xl font-circular-web text-lg leading-relaxed text-white/50">
            The Game of Games begins — your gateway to on-chain arcade glory.
            Connect your wallet, dominate the leaderboards, and earn NFT
            achievements in a blockchain-powered gaming universe.
          </p>
        </div>

        {/* Image with overlay */}
        <div className="mt-20 relative overflow-hidden rounded-2xl border border-white/5">
          <img
            src="/img/about.webp"
            alt="About Ginix Arcade"
            className="w-full h-[50vh] md:h-[60vh] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <p className="max-w-lg font-circular-web text-white/70">
              Where the boundaries between reality and the digital realm blur.
              Every pixel pulses with blockchain-verified competition.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURES SECTION — BentoTilt grid with video cards
   ═══════════════════════════════════════════════════════ */
function FeaturesSection() {
  return (
    <section className="bg-black py-28">
      <div className="container mx-auto px-6 md:px-10">
        {/* Section intro */}
        <div className="mb-16">
          <p className="font-general text-[10px] uppercase tracking-widest text-white/40">
            Into the Arcade Universe
          </p>
          <p className="mt-4 max-w-md font-circular-web text-lg text-white/50">
            Immerse yourself in a rich ecosystem of blockchain-powered arcade
            games, where every score is verified on-chain and every achievement
            is a permanent NFT trophy.
          </p>
        </div>

        {/* Main feature card */}
        <BentoTilt className="border-hsla relative mb-7 h-80 w-full overflow-hidden rounded-xl md:h-[65vh]">
          <BentoCard
            src="/videos/feature-1.mp4"
            title={<>Play <b>T</b>o <b>E</b>arn</>}
            description="Compete in browser-based arcade games and earn on-chain rewards. Every high score mints glory."
          />
        </BentoTilt>

        {/* Bento grid — 2 columns on md+, auto rows */}
        <div className="grid w-full grid-cols-1 gap-7 md:grid-cols-2">
          {/* Left tall card */}
          <BentoTilt className="border-hsla overflow-hidden rounded-xl h-72 md:h-[500px]">
            <BentoCard
              src="/videos/feature-2.mp4"
              title={<>NFT Achi<b>e</b>vements</>}
              description="Unlock unique NFT badges as you hit milestones. Your gaming legacy, permanently on-chain."
            />
          </BentoTilt>

          {/* Right column — 2 stacked */}
          <div className="flex flex-col gap-7">
            <BentoTilt className="border-hsla overflow-hidden rounded-xl h-72 md:h-[240px]">
              <BentoCard
                src="/videos/feature-3.mp4"
                title={<>Le<b>a</b>derboards</>}
                description="Transparent, tamper-proof global rankings powered by Avalanche blockchain."
              />
            </BentoTilt>
            <BentoTilt className="border-hsla overflow-hidden rounded-xl h-72 md:h-[240px]">
              <BentoCard
                src="/videos/feature-4.mp4"
                title={<>Anti-Ch<b>e</b>at</>}
                description="Server-side score validation with rate limiting ensures fair competition for all players."
              />
            </BentoTilt>
          </div>

          {/* Bottom row — "More Games" + Wallet */}
          <BentoTilt className="overflow-hidden rounded-xl h-56">
            <div className="flex size-full flex-col justify-between bg-gradient-to-br from-crimson via-dark-red to-black p-7">
              <h1 className="bento-title special-font max-w-64 text-white">
                M<b>o</b>re Ga<b>m</b>es Co<b>m</b>ing.
              </h1>
              <TiLocationArrow className="m-5 scale-[5] self-end text-white/60" />
            </div>
          </BentoTilt>

          <BentoTilt className="border-hsla overflow-hidden rounded-xl h-56">
            <BentoCard
              src="/videos/feature-5.mp4"
              title={<>W<b>a</b>llet</>}
              description="Connect with RainbowKit. One click to enter the arcade."
              isComingSoon
            />
          </BentoTilt>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   HOW IT WORKS — Step-by-step guide
   ═══════════════════════════════════════════════════════ */
const steps = [
  {
    icon: FaWallet,
    number: '01',
    title: 'Connect Wallet',
    description: 'Link your Web3 wallet via RainbowKit. Supports MetaMask, Coinbase, and more on Avalanche Fuji.',
  },
  {
    icon: FaGamepad,
    number: '02',
    title: 'Choose Your Game',
    description: 'Pick from 4 unique browser-based arcade games. Each with its own mechanics and scoring system.',
  },
  {
    icon: FaTrophy,
    number: '03',
    title: 'Compete & Earn',
    description: 'Every score is submitted on-chain. Climb the leaderboards and unlock NFT achievement badges.',
  },
  {
    icon: FaShieldAlt,
    number: '04',
    title: 'Verified Forever',
    description: 'Anti-cheat validation ensures fair play. Your achievements are permanently minted on the blockchain.',
  },
];

function HowItWorksSection() {
  return (
    <section className="bg-black py-28">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-white/40">
            How It Works
          </p>
          <AnimatedTitle
            title="Four St<b>e</b>ps To <br /> Gl<b>o</b>ry"
            containerClass="mt-5 !text-white text-center"
          />
        </div>

        <div className="mt-20 grid grid-cols-1 gap-px bg-white/5 rounded-2xl overflow-hidden sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative bg-black p-8 transition-colors duration-300 hover:bg-white/[0.03]"
            >
              <div className="flex items-start justify-between">
                <step.icon className="h-6 w-6 text-crimson" />
                <span className="font-zentry text-4xl font-black text-white/[0.06]">{step.number}</span>
              </div>
              <h3 className="mt-6 font-zentry text-xl font-bold uppercase text-white">{step.title}</h3>
              <p className="mt-3 font-circular-web text-sm leading-relaxed text-white/40">{step.description}</p>
              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 h-px w-0 bg-crimson transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   FEATURED GAMES — Grid of GameCards
   ═══════════════════════════════════════════════════════ */
function FeaturedGamesSection() {
  return (
    <section className="py-28 bg-black">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-white/40">
            Our Games
          </p>
          <AnimatedTitle
            title="Choose Y<b>o</b>ur <br /> B<b>a</b>ttle"
            containerClass="mt-5 !text-white text-center"
          />
          <p className="mt-5 max-w-md font-circular-web text-white/50">
            Four unique arcade games, each with on-chain scoring and NFT
            achievements. Pick your game and start climbing the ranks.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {games.map((game, i) => (
            <GameCard key={game.id} game={game} index={i} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 rounded-full border border-crimson/30 bg-crimson/10 px-8 py-3.5 font-general text-xs uppercase tracking-wider text-crimson hover:bg-crimson hover:text-white transition-all duration-300"
          >
            <TiLocationArrow className="text-lg" />
            View All Games
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   STATS SECTION — Glance-style interactive stat cards
   ═══════════════════════════════════════════════════════ */
function StatsSection() {
  return (
    <section className="py-28 bg-black">
      <div className="container mx-auto px-6 md:px-10">
        <div className="flex flex-col items-center text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-white/40">
            Arcade Stats
          </p>
          <AnimatedTitle
            title="The Numb<b>e</b>rs <br /> Sp<b>e</b>ak"
            containerClass="mt-5 !text-white text-center"
          />
        </div>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <GlanceCard
            src="/img/gallery-3.webp"
            title="30K+"
            description="Active Players Worldwide"
            className="h-[240px]"
          />
          <GlanceCard
            src="/img/stones.webp"
            title="4"
            description="Arcade Games Live"
            className="h-[240px]"
          />
          <GlanceCard
            src="/img/entrance.webp"
            title="2.1M"
            description="Scores Submitted On-Chain"
            className="h-[240px]"
          />
          <GlanceCard
            src="/img/about.webp"
            title="100%"
            description="Verified & On-Chain"
            className="h-[240px]"
          />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   STORY SECTION — Showcase image with description
   ═══════════════════════════════════════════════════════ */
function StorySection() {
  return (
    <section id="story" className="bg-black py-28">
      <div className="container mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left: Image */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5">
            <img
              src="/img/entrance.webp"
              alt="Ginix Arcade Arena"
              className="w-full h-[400px] md:h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
          </div>

          {/* Right: Content */}
          <div>
            <p className="font-general text-[10px] uppercase tracking-widest text-white/40">
              The Arcade Universe
            </p>
            <AnimatedTitle
              title="The St<b>o</b>ry Of <br /> A Dig<b>i</b>tal Arena"
              containerClass="mt-5 !text-white !text-left !px-0 !sm:px-0"
            />
            <p className="mt-8 font-circular-web text-lg leading-relaxed text-white/50">
              Where the boundaries between reality and the digital realm blur.
              Every pixel pulses with blockchain-verified competition. Every
              achievement becomes an eternal NFT trophy in your collection.
            </p>
            <p className="mt-4 font-circular-web text-white/30">
              Built on Avalanche. Powered by smart contracts. Secured by
              cryptography. Welcome to the future of arcade gaming.
            </p>

            <div className="mt-10 flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-crimson/10 border border-crimson/20">
                  <FaShieldAlt className="text-crimson" />
                </div>
                <div>
                  <p className="font-robert-medium text-sm text-white">Anti-Cheat</p>
                  <p className="text-xs text-white/40">Server-side validation</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-crimson/10 border border-crimson/20">
                  <FaTrophy className="text-crimson" />
                </div>
                <div>
                  <p className="font-robert-medium text-sm text-white">NFT Rewards</p>
                  <p className="text-xs text-white/40">On-chain achievements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   PARTNERS SECTION — Trusted by / Powered by
   ═══════════════════════════════════════════════════════ */
function PartnersSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const highlights = [
    {
      title: 'On-Chain Scores',
      desc: 'Every run is verified and recorded with transparent ranking logic.',
    },
    {
      title: 'Anti-Cheat Shield',
      desc: 'Server-side validation and rate limiting keep the arena fair.',
    },
    {
      title: 'NFT Badges',
      desc: 'Unlock achievements you can mint and flex forever.',
    },
    {
      title: 'Fuji Testnet Live',
      desc: 'Connect, faucet-up, and start competing in minutes.',
    },
  ];

  useGSAP(
    () => {
      gsap.from('.ap-anim-in', {
        y: 16,
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        clearProps: 'transform,opacity',
      });

      gsap.from('.ap-card', {
        y: 14,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.08,
        delay: 0.1,
        clearProps: 'transform,opacity',
      });
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative bg-black py-20 border-t border-b border-white/[0.03] overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,20,60,0.10),transparent_55%)]" />
        <div className="absolute inset-0 scan-overlay opacity-30" />
      </div>
      <div className="container mx-auto px-6 md:px-10">
        <div className="ap-anim-in relative flex flex-col items-center text-center">
          <p className="font-general text-[10px] uppercase tracking-[0.3em] text-white/20">
            Arcade Protocol
          </p>
          <h3 className="mt-4 font-zentry text-3xl font-black uppercase text-white">
            Built To <b className="text-crimson">C</b>ompete
          </h3>
          <p className="mt-4 max-w-2xl font-circular-web text-white/40">
            A competitive arena with verified scoring, fair play, and mintable achievements.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
          {highlights.map((h) => (
            <div
              key={h.title}
              className="ap-card group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.01] p-6 hover:border-crimson/20 hover:bg-crimson/[0.02] transition-all"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(220,20,60,0.16),transparent_55%)]" />
              <div className="flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-crimson/80" />
                <p className="font-robert-medium text-sm text-white group-hover:text-crimson transition-colors">
                  {h.title}
                </p>
              </div>
              <p className="mt-3 font-circular-web text-sm text-white/35 leading-relaxed">
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   CTA SECTION — Contact / Call to Action
   ═══════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="relative bg-black py-28 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-crimson/5 rounded-full blur-[200px] pointer-events-none" />

      <div className="container mx-auto px-6 md:px-10">
        <div className="relative rounded-2xl border border-white/5 bg-gradient-to-br from-crimson/10 via-black to-dark-red/10 p-10 md:p-20 overflow-hidden scan-overlay">
          {/* Decorative images */}
          <div className="absolute -left-10 -top-10 w-40 opacity-15 md:w-60">
            <img src="/img/contact-1.webp" alt="" className="w-full object-cover" />
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 opacity-15 md:w-60">
            <img src="/img/swordman.webp" alt="" className="w-full object-cover" />
          </div>

          {/* Grid pattern */}
          <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-crimson/20 bg-crimson/5 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-crimson animate-pulse" />
              <span className="font-general text-[10px] uppercase tracking-[0.2em] text-crimson">Join the Arena</span>
            </div>
            <AnimatedTitle
              title="Rea<b>d</b>y To <br /> D<b>o</b>minate?"
              containerClass="mt-5 !text-white"
            />
            <p className="mt-6 max-w-md font-circular-web text-white/50">
              Connect your wallet, choose your game, and start earning on-chain
              achievements. The leaderboard awaits.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/library"
                className="group flex items-center gap-2 rounded-full bg-crimson px-8 py-4 font-general text-xs uppercase tracking-wider text-white hover:bg-electric-red hover:shadow-[0_0_30px_rgba(220,20,60,0.4)] transition-all duration-300"
              >
                <TiLocationArrow className="text-lg transition-transform group-hover:translate-x-1" />
                Start Playing
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-4 font-general text-xs uppercase tracking-wider text-white/80 hover:border-crimson/40 hover:bg-crimson/10 transition-all duration-300"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE — Compose all sections
   ═══════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <main className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FeaturedGamesSection />
      <StatsSection />
      <StorySection />
      <PartnersSection />
      <CTASection />
    </main>
  );
}
