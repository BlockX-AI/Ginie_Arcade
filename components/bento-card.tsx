'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { TiLocationArrow } from 'react-icons/ti';

interface BentoCardProps {
  src: string;
  title: React.ReactNode;
  description?: string;
  isComingSoon?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function BentoCard({
  src,
  title,
  description,
  isComingSoon,
  className,
  children,
}: BentoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setIsInView(Boolean(entry?.isIntersecting)),
      { threshold: 0.15 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    if (isInView) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isInView]);

  return (
    <div
      className={clsx('relative size-full', className)}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute left-0 top-0 size-full object-cover object-center"
      />
      <div className="relative z-10 flex size-full flex-col justify-between p-5 text-blue-50">
        <div>
          <h1 className="bento-title special-font">{title}</h1>
          {description && (
            <p className="mt-3 max-w-64 text-xs md:text-base">{description}</p>
          )}
        </div>

        {isComingSoon && (
          <div className="border-hsla flex w-fit items-center gap-1 rounded-full bg-black px-5 py-2 text-xs uppercase text-white/40 transition-colors duration-300 hover:bg-white/5 hover:text-white/60">
            <TiLocationArrow />
            <p>coming soon</p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
