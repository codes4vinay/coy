'use client';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
  LoaderCircle,
} from 'lucide-react';
import type { Profile } from '@/lib/api';
import { ProfileCard } from './profile-card';
import { PortraitPreload } from './portrait-preload';
import type { SwipeDirection } from '@/lib/swipe-motion';
function SlowSaveHint() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), 1200);
    return () => clearTimeout(timer);
  }, []);
  return slow ? (
    <>
      <LoaderCircle size={15} className="spin" />
      One moment…
    </>
  ) : (
    <>A little courage goes a long way.</>
  );
}
export function DiscoveryFeed({
  profiles,
  busy,
  swipeDirection,
  swipe,
  onMatches,
  load,
}: {
  profiles: Profile[];
  busy: boolean;
  swipeDirection: SwipeDirection | null;
  swipe: (d: 'like' | 'pass') => Promise<void>;
  onMatches: () => void;
  load: () => Promise<void>;
}) {
  return (
    <div className="discovery-layout">
      <PortraitPreload photos={profiles.slice(1, 3).map((profile) => profile.photo)} />
      <aside className="intro-panel">
        <span className="note-eyebrow">LESS PRESSURE, MORE POSSIBILITY</span>
        <h2>
          Go on.
          <br />
          Be a little
          <br />
          <span>curious.</span>
        </h2>
        <p>You don’t need the perfect opening line. Sometimes, a quiet little like is enough.</p>
        <div className="handwritten">
          something good
          <br />
          could start here <span>↗</span>
        </div>
        <div className="stock-note">
          Fictional people.
          <br />
          Real possibilities for a demo.
        </div>
      </aside>
      <section className="card-zone" aria-label="Profile discovery">
        {profiles[0] ? (
          <>
            <ProfileCard
              key={profiles[0]._id}
              profile={profiles[0]}
              busy={busy}
              direction={swipeDirection}
              onSwipe={(d) => void swipe(d)}
            />
            <div className="action-row">
              <div>
                <button
                  className="action-button pass-button"
                  onClick={() => void swipe('pass')}
                  disabled={busy}
                  aria-label="Pass on this profile"
                >
                  <X size={26} />
                </button>
                <span>Pass</span>
              </div>
              <p role="status" aria-live="polite">
                {busy ? <SlowSaveHint /> : <>A little courage goes a long way.</>}
              </p>
              <div>
                <button
                  className="action-button like-button"
                  onClick={() => void swipe('like')}
                  disabled={busy}
                  aria-label="Like this profile"
                >
                  <Heart size={26} fill="currentColor" />
                </button>
                <span>Like</span>
              </div>
            </div>
            <p className="keyboard-hint">
              <span>
                <ArrowLeft size={12} />
              </span>{' '}
              pass{' '}
              <span>
                <ArrowRight size={12} />
              </span>{' '}
              like <i /> or swipe the card
            </p>
          </>
        ) : (
          <div className="state-card empty-feed">
            <span className="state-icon">
              <Sparkles />
            </span>
            <h2>You’ve met everyone for now.</h2>
            <p>
              A little pause, not the end of the story. Your choices are saved. Take a look at the
              connections you’ve made.
            </p>
            <button className="primary-button" onClick={() => onMatches()}>
              See your matches <Heart size={17} />
            </button>
            <button className="text-button" onClick={() => void load()}>
              Check for new people <RefreshCw size={15} />
            </button>
          </div>
        )}
      </section>
      <aside className="privacy-panel">
        <div className="privacy-icon">
          <LockKeyhole size={24} />
          <span>✦</span>
        </div>
        <h3>
          Your feelings.
          <br /> Your little secret.
        </h3>
        <p>Like freely. Nobody finds out unless they like you too.</p>
        <div className="privacy-rule" />
        <div className="promise">
          <ShieldCheck size={18} />
          <div>
            <strong>Only mutual. Always.</strong>
            <p>
              No incoming-like lists.
              <br />
              No hints. No pressure.
            </p>
          </div>
        </div>
        <span className="privacy-footnote">
          A connection takes two.
          <br />
          That’s the Coy promise.
        </span>
      </aside>
    </div>
  );
}
