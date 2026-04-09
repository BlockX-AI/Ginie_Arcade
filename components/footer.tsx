import Link from 'next/link';
import { FaDiscord, FaXTwitter, FaGithub, FaTelegram } from 'react-icons/fa6';

const socialLinks = [
  { href: '#', icon: FaXTwitter, label: 'Twitter' },
  { href: '#', icon: FaDiscord, label: 'Discord' },
  { href: '#', icon: FaGithub, label: 'GitHub' },
  { href: '#', icon: FaTelegram, label: 'Telegram' },
];

const footerColumns = [
  {
    title: 'Platform',
    links: [
      { href: '/', label: 'Home' },
      { href: '/library', label: 'Game Library' },
      { href: '/leaderboard', label: 'Leaderboard' },
      { href: '/dashboard', label: 'Dashboard' },
    ],
  },
  {
    title: 'Community',
    links: [
      { href: '/blog', label: 'Blog' },
      { href: '/news', label: 'News' },
      { href: '/contact', label: 'Contact Us' },
      { href: '#', label: 'Tournaments' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { href: '#', label: 'Documentation' },
      { href: '#', label: 'Smart Contracts' },
      { href: '#', label: 'Snowtrace Explorer' },
      { href: '#', label: 'Privacy Policy' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.03] bg-black">
      {/* Top accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-1/4 bg-gradient-to-r from-transparent via-crimson/30 to-transparent" />

      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-pattern opacity-25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,20,60,0.18),transparent_55%)]" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-5 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-crimson/10 border border-crimson/20 group-hover:bg-crimson/20 transition-colors">
                <img
                  src="/Ginie.ico"
                  alt="Ginie"
                  className="h-4 w-4"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span className="font-zentry text-2xl font-bold tracking-tight">
                <span className="text-crimson">GINIX</span>
                <span className="text-white"> ARCADE</span>
              </span>
            </Link>
            <p className="font-circular-web text-sm leading-relaxed text-white/35 max-w-sm mb-8">
              The premier Web3 blockchain arcade gaming platform. Play, compete,
              earn rewards, and mint achievement NFTs on the Avalanche network.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2 mb-8">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="flex items-center justify-center w-9 h-9 rounded-lg border border-white/5 bg-white/[0.02] text-white/30 hover:text-crimson hover:border-crimson/20 hover:bg-crimson/5 transition-all duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p className="font-general text-[9px] uppercase tracking-[0.2em] text-white/20 mb-3">
                Stay Updated
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg bg-white/[0.03] border border-white/5 px-4 py-2.5 text-xs text-white placeholder:text-white/20 focus:border-crimson/30 focus:outline-none transition-colors"
                />
                <button className="rounded-lg bg-crimson px-5 py-2.5 font-general text-[10px] uppercase tracking-wider text-white hover:bg-electric-red transition-colors">
                  Join
                </button>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4 className="font-general text-[9px] uppercase tracking-[0.2em] text-white/20 mb-5">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-circular-web text-sm text-white/35 hover:text-crimson transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/[0.03]">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-circular-web text-[11px] text-white/20">
              &copy; {new Date().getFullYear()} Ginix Arcade. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.02] border border-white/5 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500/60" />
                <span className="font-mono text-[9px] text-white/20">Avalanche Fuji</span>
              </span>
              <span className="font-mono text-[9px] text-white/10">Next.js + Web3</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
