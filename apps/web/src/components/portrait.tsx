'use client';
import { useState } from 'react';
import Image from 'next/image';
export function Portrait({
  src,
  name,
  className = '',
  eager = false,
}: {
  src: string;
  name: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  // Local stock assets are intentionally used so discovery does not contact image trackers.
  return failed ? (
    <div
      className={`portrait-fallback ${className}`}
      role="img"
      aria-label={`Portrait unavailable for ${name}`}
    >
      {name.slice(0, 1)}
    </div>
  ) : (
    <Image
      className={className}
      src={src}
      alt={`Illustrative portrait for ${name}`}
      fill
      sizes="(max-width: 650px) 90vw, 360px"
      loading={eager ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
      draggable={false}
    />
  );
}
