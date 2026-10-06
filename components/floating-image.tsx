'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import clsx from 'clsx';

interface FloatingImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export default function FloatingImage({
  src,
  alt,
  className,
  containerClassName,
}: FloatingImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const element = frameRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const xPos = clientX - rect.left;
    const yPos = clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((yPos - centerY) / centerY) * -10;
    const rotateY = ((xPos - centerX) / centerX) * 10;

    gsap.to(element, {
      duration: 0.3,
      rotateX,
      rotateY,
      transformPerspective: 500,
      ease: 'power1.inOut',
    });
  };

  const handleMouseLeave = () => {
    const element = frameRef.current;
    if (!element) return;

    gsap.to(element, {
      duration: 0.3,
      rotateX: 0,
      rotateY: 0,
      ease: 'power1.inOut',
    });
  };

  return (
    <div className={clsx('relative', containerClassName)}>
      <div
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative overflow-hidden rounded-lg"
        style={{ willChange: 'transform' }}
      >
        {/* SVG Filter for gooey effect */}
        <svg className="absolute size-0" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="flt_tag">
              <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
              <feColorMatrix
                in="blur"
                mode="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
                result="flt_tag"
              />
              <feComposite in="SourceGraphic" in2="flt_tag" operator="atop" />
            </filter>
          </defs>
        </svg>

        <img
          src={src}
          alt={alt}
          className={clsx('w-full object-cover', className)}
          style={{ filter: 'url(#flt_tag)' }}
        />
      </div>
    </div>
  );
}
