'use client';

import clsx from 'clsx';

interface GlanceCardProps {
  src?: string;
  title: string;
  description: string;
  className?: string;
  isVideo?: boolean;
}

export function GlanceCard({ src, title, description, className, isVideo }: GlanceCardProps) {
  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-lg border border-white/10 bg-black/40 backdrop-blur-sm',
        'cursor-pointer transition-colors hover:border-crimson/30',
        className
      )}
    >
      {src && (
        isVideo ? (
          <video
            src={src}
            loop
            muted
            autoPlay
            playsInline
            className="absolute inset-0 size-full object-cover opacity-40"
          />
        ) : (
          <img
            src={src}
            alt={title}
            className="absolute inset-0 size-full object-cover opacity-40"
          />
        )
      )}
      <div className="relative z-10 flex size-full flex-col justify-end p-6">
        <h3 className="font-zentry text-4xl uppercase leading-none text-white md:text-5xl">
          {title}
        </h3>
        <p className="mt-2 font-circular-web text-sm text-off-white/70">{description}</p>
      </div>
    </div>
  );
}

interface GlanceStatsProps {
  stats: GlanceCardProps[];
  className?: string;
}

export default function GlanceStats({ stats, className }: GlanceStatsProps) {
  return (
    <div className={clsx('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {stats.map((stat, index) => (
        <GlanceCard key={index} {...stat} className="min-h-[200px]" />
      ))}
    </div>
  );
}
