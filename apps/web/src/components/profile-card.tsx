'use client';
import { animate, motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { Profile } from '@/lib/api';
import { Portrait } from './portrait';
import {
  SWIPE_EXIT_MS,
  SWIPE_THRESHOLD,
  SWIPE_RETURN_SPRING,
  type SwipeDirection,
  useReducedMotionPreference,
} from '@/lib/swipe-motion';
export function ProfileCard({
  profile,
  busy,
  direction,
  onSwipe,
}: {
  profile: Profile;
  busy: boolean;
  direction: SwipeDirection | null;
  onSwipe: (direction: 'like' | 'pass') => void;
}) {
  const x = useMotionValue(0);
  const card = useRef<HTMLElement>(null);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);
  const reduced = useReducedMotionPreference();
  useEffect(() => {
    // Move from the finger's release position immediately; the request runs at the same time.
    const target =
      direction && !reduced
        ? (direction === 'like' ? 1 : -1) * (window.innerWidth + (card.current?.offsetWidth ?? 360))
        : 0;
    const animation = animate(
      x,
      target,
      direction || reduced
        ? { duration: reduced ? 0 : SWIPE_EXIT_MS / 1000, ease: [0.32, 0, 0.67, 1] }
        : SWIPE_RETURN_SPRING,
    );
    return () => animation.stop();
  }, [direction, reduced, x]);
  function end(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (busy) return;
    const threshold = Math.min(SWIPE_THRESHOLD, window.innerWidth * 0.25);
    if (info.offset.x > threshold || (info.offset.x > 32 && info.velocity.x > 650)) onSwipe('like');
    else if (info.offset.x < -threshold || (info.offset.x < -32 && info.velocity.x < -650))
      onSwipe('pass');
    else animate(x, 0, reduced ? { duration: 0 } : SWIPE_RETURN_SPRING);
  }
  return (
    <div className="card-stack">
      <div className="card-shadow" aria-hidden="true" />
      <motion.article
        ref={card}
        className="profile-card"
        style={{ x, rotate: reduced ? 0 : rotate, touchAction: 'pan-y' }}
        drag={busy ? false : 'x'}
        dragMomentum={false}
        onDragStart={() => x.stop()}
        onDragEnd={end}
        initial={false}
        aria-label={`${profile.name}, ${profile.age}`}
        aria-busy={busy}
      >
        <div className="portrait-wrap">
          <Portrait src={profile.photo} name={profile.name} eager />
          <div className="photo-shade" />
          <span className="profile-label">
            <span /> A little introduction
          </span>
          <motion.span className="swipe-stamp stamp-like" style={{ opacity: likeOpacity }}>
            LIKE
          </motion.span>
          <motion.span className="swipe-stamp stamp-pass" style={{ opacity: passOpacity }}>
            PASS
          </motion.span>
          <div className="photo-caption">
            <div>
              <h2>
                {profile.name}
                <span>, {profile.age}</span>
              </h2>
              <p>
                <MapPin size={15} />
                {profile.city}
              </p>
            </div>
            <span className="hello-mark" aria-hidden="true">
              <ArrowUpRight size={22} />
            </span>
          </div>
        </div>
        <div className="profile-copy">
          <p className="bio">{profile.bio}</p>
          <div className="interests">
            {profile.interests.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div className="college">
            <span className="little-star">✳</span>
            {profile.college || 'A new connection awaits'}
          </div>
        </div>
      </motion.article>
    </div>
  );
}
