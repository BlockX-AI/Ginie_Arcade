'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, Clock, ArrowRight, User } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const blogPosts = [
  {
    slug: 'web3-gaming-future',
    title: 'The Future of Web3 Gaming: Why On-Chain Matters',
    excerpt: 'Explore how blockchain technology is revolutionizing the gaming industry, from verifiable scores to true digital ownership of in-game achievements.',
    image: '/img/about.webp',
    author: 'Ginix Team',
    date: '2026-02-15',
    readTime: '5 min',
    category: 'Web3',
  },
  {
    slug: 'nft-achievements-guide',
    title: 'NFT Achievements: Your Permanent Gaming Legacy',
    excerpt: 'Learn how Ginix Arcade mints your gaming achievements as NFTs on the Avalanche network, creating a permanent record of your gaming glory.',
    image: '/img/entrance.webp',
    author: 'Ginix Team',
    date: '2026-02-10',
    readTime: '4 min',
    category: 'Guides',
  },
  {
    slug: 'anti-cheat-deep-dive',
    title: 'Anti-Cheat Deep Dive: How We Keep Scores Fair',
    excerpt: 'A technical look at our server-side score validation, rate limiting, nonce verification, and how blockchain makes cheating nearly impossible.',
    image: '/img/gallery-3.webp',
    author: 'Ginix Team',
    date: '2026-02-05',
    readTime: '7 min',
    category: 'Technical',
  },
  {
    slug: 'avalanche-fuji-guide',
    title: 'Getting Started with Avalanche Fuji Testnet',
    excerpt: 'Step-by-step guide to setting up your wallet, getting test AVAX from the faucet, and connecting to the Ginix Arcade platform.',
    image: '/img/stones.webp',
    author: 'Ginix Team',
    date: '2026-01-28',
    readTime: '3 min',
    category: 'Guides',
  },
  {
    slug: 'leaderboard-strategies',
    title: 'Top Strategies to Climb the Leaderboard',
    excerpt: 'Pro tips and strategies from top-ranked players on how to maximize your scores across all four arcade games.',
    image: '/img/contact-1.webp',
    author: 'Ginix Team',
    date: '2026-01-20',
    readTime: '6 min',
    category: 'Gaming',
  },
  {
    slug: 'roadmap-2026',
    title: 'Ginix Arcade 2026 Roadmap: What\'s Coming Next',
    excerpt: 'Multiplayer battles, tournament modes, new game submissions, and cross-chain expansion — here\'s what we\'re building next.',
    image: '/img/swordman.webp',
    author: 'Ginix Team',
    date: '2026-01-15',
    readTime: '5 min',
    category: 'Updates',
  },
];

const categories = ['All', 'Web3', 'Guides', 'Technical', 'Gaming', 'Updates'];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const pageRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const filteredPosts = useMemo(() => {
    if (activeCategory === 'All') return blogPosts;
    return blogPosts.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

  const featuredPost = filteredPosts[0];

  useGSAP(
    () => {
      gsap.from('.blog-anim-in', {
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
    if (!gridRef.current) return;
    gsap.killTweensOf(gridRef.current);
    gsap.fromTo(
      gridRef.current.querySelectorAll('.blog-card'),
      { y: 10, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.05,
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
        <div className="blog-anim-in relative z-10 container mx-auto px-6 md:px-10 text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-crimson">Blog</p>
          <h1 className="mt-4 font-zentry text-5xl font-black uppercase text-white md:text-7xl">
            Ar<b className="text-crimson">c</b>ade <b className="text-crimson">J</b>ournal
          </h1>
          <p className="mt-4 max-w-lg mx-auto font-circular-web text-white/50">
            Insights, guides, and updates from the Ginix Arcade universe.
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="container mx-auto px-6 md:px-10 -mt-6 relative z-20">
        <div className="blog-anim-in flex items-center gap-2 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-general uppercase tracking-wider transition-all duration-300 border ${
                activeCategory === cat
                  ? 'bg-crimson text-white border-crimson'
                  : 'bg-white/5 text-white/50 border-white/10 hover:border-crimson/30 hover:text-crimson'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Featured Post */}
      <div className="container mx-auto px-6 md:px-10 py-16">
        {featuredPost ? (
          <Link href={`/blog/${featuredPost.slug}`} className="blog-anim-in group block">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-auto">
                <img src={featuredPost.image} alt={featuredPost.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80 md:block hidden" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent md:hidden" />
              </div>
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-4">
                  <span className="rounded-full bg-crimson/20 border border-crimson/30 px-3 py-1 text-[10px] font-general uppercase tracking-wider text-crimson">
                    {featuredPost.category}
                  </span>
                  <span className="text-xs text-white/30">Featured</span>
                </div>
                <h2 className="font-zentry text-2xl font-bold uppercase text-white md:text-3xl group-hover:text-crimson transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="mt-3 font-circular-web text-sm text-white/50 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <div className="mt-6 flex items-center gap-4 text-xs text-white/30">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" />{featuredPost.author}</span>
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{featuredPost.date}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featuredPost.readTime}</span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-crimson font-general text-xs uppercase tracking-wider group-hover:gap-3 transition-all">
                  Read Article <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
          </Link>
        ) : (
          <div className="blog-anim-in rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="font-zentry text-2xl font-bold uppercase text-white/50">No Articles</p>
            <p className="mt-2 font-circular-web text-sm text-white/30">Try a different category.</p>
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <div className="container mx-auto px-6 md:px-10 pb-28">
        <div ref={gridRef} className="blog-grid grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.slice(1).map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card group block">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 transition-all duration-300 hover:border-crimson/30 h-full flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute top-3 left-3 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 px-3 py-1 text-[10px] font-general uppercase tracking-wider text-white/70">
                    {post.category}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-zentry text-lg font-bold uppercase text-white group-hover:text-crimson transition-colors leading-tight">
                    {post.title}
                  </h3>
                  <p className="mt-2 font-circular-web text-xs text-white/40 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-[10px] text-white/25">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{post.date}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
