'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[Ginix] Route error:', error);
  }, [error]);

  return (
    <main className="relative min-h-screen w-screen overflow-hidden bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-10 text-center">
        <p className="font-general text-[10px] uppercase tracking-[0.3em] text-crimson">Something went wrong</p>
        <h1 className="mt-4 font-zentry text-3xl font-black uppercase text-white">Arcade System Error</h1>
        <p className="mt-3 font-circular-web text-sm text-white/40">
          An unexpected error occurred while rendering this page. Try again, or return to safety.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full bg-crimson px-8 py-3 text-xs font-robert-medium uppercase tracking-wider text-white hover:bg-electric-red transition-colors"
          >
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-3 text-xs font-robert-medium uppercase tracking-wider text-white/70 hover:border-crimson/30 hover:text-white transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
