'use client';
import {
  motion,
  useMotionValue,
  useTransform,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { Profile } from '@/lib/api';
import { Portrait } from './portrait';
export const SWIPE_THRESHOLD = 100;
export function ProfileCard({
  profile,
  busy,
  onSwipe,
}: {
  profile: Profile;
  busy: boolean;
  onSwipe: (direction: 'like' | 'pass') => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);
  const reduced = useReducedMotion();
  function end(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (busy) return;
    if (info.offset.x > SWIPE_THRESHOLD) onSwipe('like');
    else if (info.offset.x < -SWIPE_THRESHOLD) onSwipe('pass');
  }
  return (
    <div className="card-stack">
      <div className="card-shadow" aria-hidden="true" />
      <motion.article
        className="profile-card"
        style={{ x, rotate: reduced ? 0 : rotate, touchAction: 'pan-y' }}
        drag={busy ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={end}
        initial={{ opacity: 0, y: reduced ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit="depart"
        variants={{
          depart: (direction: string) => ({
            opacity: 0,
            x: reduced ? 0 : direction === 'pass' ? -160 : 160,
          }),
        }}
        transition={{ duration: reduced ? 0 : 0.25 }}
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
