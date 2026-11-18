'use client';
import { useSyncExternalStore } from 'react';

export type SwipeDirection = 'like' | 'pass';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
function subscribeToMotionPreference(onChange: () => void) {
  const preference = window.matchMedia(REDUCED_MOTION_QUERY);
  preference.addEventListener('change', onChange);
  return () => preference.removeEventListener('change', onChange);
}
export function useReducedMotionPreference() {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export const SWIPE_THRESHOLD = 100;
export const SWIPE_EXIT_MS = 240;
export const SWIPE_RETURN_SPRING = {
  type: 'spring' as const,
  stiffness: 480,
  damping: 38,
  mass: 0.8,
};
