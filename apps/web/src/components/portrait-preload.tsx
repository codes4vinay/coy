'use client';
import { useEffect } from 'react';
import { getImageProps } from 'next/image';
import { PORTRAIT_SIZES } from './portrait';

export function PortraitPreload({ photos }: { photos: string[] }) {
  const sources = photos.join('|');
  useEffect(() => {
    // Use the exact responsive URLs rendered by next/image, not separate full-size downloads.
    for (const src of sources.split('|').filter(Boolean)) {
      const { props } = getImageProps({ src, alt: '', fill: true, sizes: PORTRAIT_SIZES });
      const image = new window.Image();
      image.decoding = 'async';
      image.fetchPriority = 'low';
      image.sizes = props.sizes ?? '';
      image.srcset = props.srcSet ?? '';
      image.src = props.src;
      void image.decode().catch(() => {
        /* The visible portrait already provides a fallback. */
      });
    }
  }, [sources]);
  return null;
}
