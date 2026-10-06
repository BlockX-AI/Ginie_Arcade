'use client';

import clsx from 'clsx';

interface BentoTiltProps {
  children: React.ReactNode;
  className?: string;
}

export default function BentoTilt({ children, className }: BentoTiltProps) {
  return (
    <div className={clsx(className)}>
      {children}
    </div>
  );
}
