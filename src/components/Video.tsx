import React from 'react';

interface VideoProps {
  src: string;
  poster?: string;
  className?: string;
}

export default function Video({ src, poster, className = '' }: VideoProps) {
  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <video
        className="w-full h-full object-cover"
        controls
        poster={poster}
        preload="metadata"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
} 