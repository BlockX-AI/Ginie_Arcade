'use client';

import { useRef, useState } from 'react';
import { Send, Mail, MessageSquare, MapPin, Globe, Github, Twitter } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export default function ContactPage() {
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const pageRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.from('.contact-anim-in', {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setFormState({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <main ref={pageRef} className="relative min-h-screen w-screen overflow-x-hidden bg-black">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-bg">
          <img src="/img/breadcrumb.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/80 to-black" />
        </div>
        <div className="contact-anim-in relative z-10 container mx-auto px-6 md:px-10 text-center">
          <p className="font-general text-[10px] uppercase tracking-widest text-crimson">Get In Touch</p>
          <h1 className="mt-4 font-zentry text-5xl font-black uppercase text-white md:text-7xl">
            C<b className="text-crimson">o</b>ntact <b className="text-crimson">U</b>s
          </h1>
          <p className="mt-4 max-w-lg mx-auto font-circular-web text-white/50">
            Have questions, feedback, or want to submit your game? We&apos;d love to hear from you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-10 py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="contact-anim-in lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-zentry text-2xl font-bold uppercase text-white mb-6">
                Let&apos;s <span className="text-crimson">Connect</span>
              </h2>
              <p className="font-circular-web text-sm text-white/50 leading-relaxed">
                Whether you&apos;re a player with feedback, a developer wanting to submit a game, or a partner looking to collaborate — reach out and we&apos;ll get back to you within 24 hours.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4 group">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-crimson/30 group-hover:bg-crimson/10 transition-all">
                  <Mail className="h-5 w-5 text-white/40 group-hover:text-crimson transition-colors" />
                </div>
                <div>
                  <p className="font-robert-medium text-sm text-white">Email</p>
                  <p className="font-circular-web text-xs text-white/40">contact@ginixarcade.io</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-crimson/30 group-hover:bg-crimson/10 transition-all">
                  <MessageSquare className="h-5 w-5 text-white/40 group-hover:text-crimson transition-colors" />
                </div>
                <div>
                  <p className="font-robert-medium text-sm text-white">Discord</p>
                  <p className="font-circular-web text-xs text-white/40">discord.gg/ginixarcade</p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 border border-white/10 group-hover:border-crimson/30 group-hover:bg-crimson/10 transition-all">
                  <Globe className="h-5 w-5 text-white/40 group-hover:text-crimson transition-colors" />
                </div>
                <div>
                  <p className="font-robert-medium text-sm text-white">Network</p>
                  <p className="font-circular-web text-xs text-white/40">Avalanche Fuji C-Chain (Testnet)</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <p className="font-general text-[10px] uppercase tracking-widest text-white/30 mb-3">Follow Us</p>
              <div className="flex items-center gap-3">
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-crimson hover:border-crimson/30 transition-all">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-crimson hover:border-crimson/30 transition-all">
                  <Github className="h-4 w-4" />
                </a>
                <a href="#" className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-crimson hover:border-crimson/30 transition-all">
                  <MessageSquare className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Decorative Image */}
            <div className="hidden lg:block relative h-48 rounded-xl overflow-hidden border border-white/10">
              <img src="/img/swordman.webp" alt="" className="w-full h-full object-cover opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="font-general text-[9px] uppercase tracking-widest text-crimson">Game Developer?</p>
                <p className="font-zentry text-lg font-bold uppercase text-white mt-1">Submit Your Game</p>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="contact-anim-in rounded-2xl border border-white/10 bg-white/[0.02] p-8 md:p-10">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="block font-general text-[10px] uppercase tracking-widest text-white/30 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState(s => ({ ...s, name: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-crimson/50 focus:outline-none focus:ring-1 focus:ring-crimson/30 transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block font-general text-[10px] uppercase tracking-widest text-white/30 mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState(s => ({ ...s, email: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-crimson/50 focus:outline-none focus:ring-1 focus:ring-crimson/30 transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="block font-general text-[10px] uppercase tracking-widest text-white/30 mb-2">Subject</label>
                <select
                  value={formState.subject}
                  onChange={(e) => setFormState(s => ({ ...s, subject: e.target.value }))}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white focus:border-crimson/50 focus:outline-none focus:ring-1 focus:ring-crimson/30 transition-colors appearance-none"
                >
                  <option value="" className="bg-black">Select a topic</option>
                  <option value="general" className="bg-black">General Inquiry</option>
                  <option value="bug" className="bg-black">Bug Report</option>
                  <option value="feedback" className="bg-black">Feedback</option>
                  <option value="game-submission" className="bg-black">Game Submission</option>
                  <option value="partnership" className="bg-black">Partnership</option>
                </select>
              </div>

              <div className="mt-5">
                <label className="block font-general text-[10px] uppercase tracking-widest text-white/30 mb-2">Message</label>
                <textarea
                  required
                  rows={6}
                  value={formState.message}
                  onChange={(e) => setFormState(s => ({ ...s, message: e.target.value }))}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:border-crimson/50 focus:outline-none focus:ring-1 focus:ring-crimson/30 transition-colors resize-none"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="font-circular-web text-[10px] text-white/20">
                  We typically respond within 24 hours.
                </p>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-crimson px-8 py-3 text-xs font-robert-medium uppercase tracking-wider text-white hover:bg-electric-red transition-colors disabled:opacity-50"
                  disabled={submitted}
                >
                  {submitted ? (
                    <>Sent!</>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Send Message
                    </>
                  )}
                </button>
              </div>

              {submitted && (
                <div className="mt-5 rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-center">
                  <p className="font-circular-web text-sm text-green-400">
                    Message sent successfully! We&apos;ll get back to you soon.
                  </p>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
