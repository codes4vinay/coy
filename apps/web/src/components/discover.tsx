'use client';
import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import {
  ArrowUpRight,
  Compass,
  Heart,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  X,
  SlidersHorizontal,
  Pause,
} from 'lucide-react';
import { useDiscovery } from '@/lib/use-discovery';
import { AppHeader } from './app-header';
import { DiscoveryFeed } from './discovery-feed';
import { Matches } from './matches';
import { MatchDialog } from './match-dialog';
import { PreferencesDialog } from './preferences-dialog';
type View = 'feed' | 'matches';
export function Discover() {
  const [tab, setTab] = useState<'home' | 'discover'>('discover');
  const [view, setView] = useState<View>('feed');
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const {
    profiles,
    matches,
    loading,
    error,
    toast,
    setToast,
    busy,
    celebration,
    setCelebration,
    lastDirection,
    load,
    swipe,
    preferences,
    preferenceOptions,
    savePreferences,
  } = useDiscovery(tab, view);
  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <AppHeader tab={tab} setTab={setTab} />
      <main id="main" className={tab === 'home' ? 'home-main' : 'discover-main'}>
        {tab === 'home' ? (
          <div className="home-placeholder">
            <span className="eyebrow">A LITTLE SPACE FOR HOME</span>
            <h1>You’re home.</h1>
            <p>New possibilities are waiting in Discover.</p>
            <button className="primary-button" onClick={() => setTab('discover')}>
              Go to Discover <ArrowUpRight size={18} />
            </button>
          </div>
        ) : (
          <>
            <div className="page-heading">
              <div>
                <span className="eyebrow">
                  <span className="pink-dot" />
                  REAL PEOPLE. QUIET POSSIBILITIES.
                </span>
                <h1>
                  {view === 'feed' ? (
                    <>
                      A little spark.
                      <br className="mobile-break" /> A new <span>maybe.</span>
                    </>
                  ) : (
                    <>
                      The feeling is <span>mutual.</span>
                    </>
                  )}
                </h1>
                <p>
                  {view === 'feed'
                    ? 'Meet someone who makes you curious. The rest can start with a like.'
                    : 'No guessing games. Just connections you both chose.'}
                </p>
              </div>
              <span className="heading-doodle" aria-hidden="true">
                ✳
              </span>
            </div>
            <div className="discover-toolbar">
              <div className="sub-nav" role="group" aria-label="Discover view">
                <button aria-pressed={view === 'feed'} onClick={() => setView('feed')}>
                  <Compass size={16} />
                  For you
                </button>
                <button
                  aria-pressed={view === 'matches'}
                  onClick={() => {
                    setView('matches');
                    if (!busy) void load();
                  }}
                >
                  <Heart size={16} />
                  Matches{matches.length > 0 && <span className="count">{matches.length}</span>}
                </button>
              </div>
              <button
                className="preferences-trigger"
                aria-label="Discovery preferences"
                onClick={() => setPreferencesOpen(true)}
                disabled={busy || loading || !!error}
              >
                <SlidersHorizontal size={16} />
                <span>Preferences</span>
                {preferences.paused && (
                  <span className="paused-dot" aria-label="Discovery paused" />
                )}
              </button>
            </div>
            {!loading &&
              !error &&
              view === 'feed' &&
              !preferences.paused &&
              (preferences.city || preferences.interests.length > 0) && (
                <div className="active-preferences">
                  <span>
                    {preferences.city || 'Any city'}
                    {preferences.interests.length > 0
                      ? ` · ${preferences.interests.join(', ')}`
                      : ''}
                  </span>
                  <button onClick={() => setPreferencesOpen(true)}>Edit</button>
                </div>
              )}
            {error ? (
              <div className="state-card" role="alert">
                <span className="state-icon">
                  <RefreshCw />
                </span>
                <h2>A small pause in the possibilities.</h2>
                <p>{error}</p>
                <button className="primary-button" onClick={() => void load()}>
                  Try again <RefreshCw size={17} />
                </button>
              </div>
            ) : loading ? (
              <div className="loading-zone" aria-label="Loading profiles" role="status">
                <div className="skeleton-card">
                  <div />
                  <span />
                  <span />
                </div>
                <p>Finding new possibilities…</p>
              </div>
            ) : view === 'matches' ? (
              <Matches matches={matches} onDiscover={() => setView('feed')} />
            ) : preferences.paused ? (
              <div className="state-card">
                <span className="state-icon">
                  <Pause />
                </span>
                <h2>A little room to breathe.</h2>
                <p>
                  Discovery is paused. Your matches and saved choices are right where you left them.
                  Come back at your own pace.
                </p>
                <button className="primary-button" onClick={() => setPreferencesOpen(true)}>
                  Manage discovery <SlidersHorizontal size={17} />
                </button>
                <button className="text-button" onClick={() => setView('matches')}>
                  Visit your matches <Heart size={16} />
                </button>
              </div>
            ) : !profiles.length && (preferences.city || preferences.interests.length > 0) ? (
              <div className="state-card">
                <span className="state-icon">
                  <Compass />
                </span>
                <h2>No introductions in this mix yet.</h2>
                <p>
                  Try another city or a few different interests. Your previous likes and passes stay
                  saved.
                </p>
                <button className="primary-button" onClick={() => setPreferencesOpen(true)}>
                  Adjust preferences <SlidersHorizontal size={17} />
                </button>
              </div>
            ) : (
              <DiscoveryFeed
                profiles={profiles}
                busy={busy}
                lastDirection={lastDirection}
                swipe={swipe}
                onMatches={() => setView('matches')}
                load={load}
              />
            )}
            <footer className="page-footer">
              <span>
                <LockKeyhole size={13} />
                Private by design. Mutual by choice.
              </span>
              <a href="https://getcoy.com/blog/how-coy-works" target="_blank" rel="noreferrer">
                The Coy way <ArrowUpRight size={13} />
              </a>
            </footer>
          </>
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          <ShieldCheck size={17} />
          <span>{toast}</span>
          <button aria-label="Dismiss notification" onClick={() => setToast('')}>
            <X size={16} />
          </button>
        </div>
      )}
      {celebration && (
        <MatchDialog
          match={celebration}
          onContinue={() => setCelebration(null)}
          onMatches={() => {
            setCelebration(null);
            setView('matches');
          }}
        />
      )}
      {preferencesOpen && (
        <PreferencesDialog
          preferences={preferences}
          options={preferenceOptions}
          onSave={savePreferences}
          onClose={() => setPreferencesOpen(false)}
        />
      )}
    </MotionConfig>
  );
}
