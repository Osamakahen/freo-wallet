import React from 'react';
import Image from 'next/image';

interface PosterProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}

export default function Poster({ src, alt, width = 1920, height = 1080, className = '' }: PosterProps) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="w-full h-full object-cover"
      />
    </div>
  );
} 