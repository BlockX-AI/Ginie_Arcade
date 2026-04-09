'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useRef } from 'react';
import { ArrowLeft, Calendar, Clock, User, Share2 } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const blogData: Record<string, { title: string; image: string; date: string; readTime: string; category: string; content: string[] }> = {
  'web3-gaming-future': {
    title: 'The Future of Web3 Gaming: Why On-Chain Matters',
    image: '/img/about.webp',
    date: '2026-02-15',
    readTime: '5 min',
    category: 'Web3',
    content: [
      'The gaming industry is undergoing a fundamental transformation. For decades, players have invested countless hours building characters, earning achievements, and setting high scores — only for all of it to exist on centralized servers controlled by game publishers.',
      'Web3 gaming changes this paradigm entirely. By leveraging blockchain technology, every score, achievement, and in-game asset becomes verifiable, permanent, and truly owned by the player.',
      'At Ginix Arcade, we\'ve built our entire platform on this principle. Every score submitted goes through our anti-cheat validation system before being recorded on the Avalanche blockchain. This means your gaming achievements are as permanent as any financial transaction.',
      'The implications are profound. Imagine a world where your gaming reputation follows you across platforms. Where your level 50 achievement in one game grants you special access in another. Where tournament results are indisputable because they\'re verified on-chain.',
      'This isn\'t a distant future — it\'s what we\'re building right now. Our NFT achievement system already mints your accomplishments as permanent digital assets. Our leaderboards are transparent and verifiable by anyone.',
      'The next frontier is cross-game interoperability. We\'re working on standards that will allow achievements and assets to move freely between games on the Ginix platform and beyond.',
    ],
  },
  'nft-achievements-guide': {
    title: 'NFT Achievements: Your Permanent Gaming Legacy',
    image: '/img/entrance.webp',
    date: '2026-02-10',
    readTime: '4 min',
    category: 'Guides',
    content: [
      'Every gamer knows the thrill of unlocking a rare achievement. On Ginix Arcade, that thrill comes with a permanent reward — an NFT minted directly to your wallet on the Avalanche network.',
      'Our badge system has four tiers: Bronze, Silver, Gold, and Platinum. Each tier represents increasing levels of skill and dedication. Bronze badges might be earned after your first game, while Platinum requires reaching level 50.',
      'When you earn a badge, it\'s automatically minted as an NFT. You can view it on Snowtrace, share it with friends, or display it in your dashboard. Unlike traditional gaming achievements, these can never be taken away or lost.',
      'The minting process is seamless — our server-side minting system handles the gas fees, so you don\'t need to approve any transactions. The NFT simply appears in your wallet.',
      'We\'re also working on Score NFTs, which will let you mint your personal best scores as collectible items. Imagine owning a verified, on-chain record of the #1 all-time score in Neon Sky Runner.',
    ],
  },
};

const defaultPost = {
  title: 'Article Coming Soon',
  image: '/img/gallery-3.webp',
  date: '2026-02-01',
  readTime: '3 min',
  category: 'Updates',
  content: [
    'This article is currently being written. Check back soon for the full content.',
    'In the meantime, explore our other articles or jump into a game to start earning achievements.',
  ],
};

export default function BlogPost() {
  const params = useParams();
  const slug = params.slug as string;
  const post = blogData[slug] || defaultPost;

  const pageRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('.post-anim-in', {
        y: 14,
        opacity: 0,
        duration: 0.55,
        ease: 'power2.out',
        stagger: 0.08,
        clearProps: 'transform,opacity',
      });

      gsap.from('.post-paragraph', {
        y: 10,
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out',
        stagger: 0.06,
        clearProps: 'transform,opacity',
        delay: 0.15,
      });
    },
    { scope: pageRef }
  );

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      {/* Hero Image */}
      <div className="relative h-[40vh] md:h-[50vh]">
        <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
        <div className="absolute top-24 left-6 md:left-10 z-10">
          <Link href="/blog" className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 md:px-10 -mt-20 relative z-10">
        <div className="max-w-3xl mx-auto">
          {/* Meta */}
          <div className="post-anim-in flex items-center gap-3 mb-5">
            <span className="rounded-full bg-crimson/20 border border-crimson/30 px-3 py-1 text-[10px] font-general uppercase tracking-wider text-crimson">
              {post.category}
            </span>
          </div>

          <h1 className="post-anim-in font-zentry text-3xl font-bold uppercase text-white md:text-5xl leading-tight">
            {post.title}
          </h1>

          <div className="post-anim-in mt-5 flex items-center gap-5 text-xs text-white/30 border-b border-white/5 pb-6">
            <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />Ginix Team</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{post.date}</span>
            <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.readTime}</span>
          </div>

          {/* Article Body */}
          <article className="mt-10 space-y-6">
            {post.content.map((paragraph, i) => (
              <p key={i} className="post-paragraph font-circular-web text-base text-white/60 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </article>

          {/* Share */}
          <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-6 pb-20">
            <Link href="/blog" className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-crimson transition-colors font-general uppercase tracking-wider">
              <ArrowLeft className="h-3 w-3" />
              More Articles
            </Link>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs text-white/40 hover:text-white hover:border-white/20 transition-all">
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
