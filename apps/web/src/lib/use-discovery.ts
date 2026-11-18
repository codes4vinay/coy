'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  api,
  ApiError,
  type Profile,
  type Match,
  type Preferences,
  type PreferenceOptions,
} from '@/lib/api';
import { SWIPE_EXIT_MS, type SwipeDirection } from './swipe-motion';
export function useDiscovery(tab: 'home' | 'discover', view: 'feed' | 'matches') {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState<Match | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const [preferences, setPreferences] = useState<Preferences>({
    paused: false,
    city: '',
    interests: [],
  });
  const [preferenceOptions, setPreferenceOptions] = useState<PreferenceOptions>({
    cities: [],
    interests: [],
  });
  // A ref locks immediately, before React renders disabled buttons, blocking rapid duplicate input.
  const lock = useRef(false);
  const loadVersion = useRef(0);
  const load = useCallback(async () => {
    const version = ++loadVersion.current;
    setLoading(true);
    setError('');
    try {
      const [feed, connections, settings] = await Promise.all([
        api.feed(),
        api.matches(),
        api.preferences(),
      ]);
      // Ignore stale refreshes that finish after a newer request or preference change.
      if (version !== loadVersion.current) return;
      setProfiles(feed.profiles);
      setMatches(connections.matches);
      setPreferences(settings.preferences);
      setPreferenceOptions(settings.options);
    } catch (e) {
      if (version === loadVersion.current) setError((e as Error).message);
    } finally {
      if (version === loadVersion.current) setLoading(false);
    }
  }, []);
  const savePreferences = useCallback(
    async (next: Preferences) => {
      if (lock.current) throw new Error('Please wait for your current choice to finish saving.');
      lock.current = true;
      setBusy(true);
      try {
        const saved = await api.savePreferences(next);
        setPreferences(saved.preferences);
        await load();
        setToast(
          next.paused
            ? 'Discovery paused. Your matches and choices are safe.'
            : 'Preferences saved. Your next introduction is ready.',
        );
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [load],
  );
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 5500);
    return () => clearTimeout(timer);
  }, [toast]);
  const swipe = useCallback(
    async (direction: 'like' | 'pass') => {
      const profile = profiles[0];
      if (!profile || lock.current || celebration || loading || preferences.paused) return;
      lock.current = true;
      setBusy(true);
      setSwipeDirection(direction);
      const started = performance.now();
      try {
        const result = await api.swipe(profile._id, direction);
        // Saving and motion overlap. Never replace a card before both are complete.
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 0
          : SWIPE_EXIT_MS;
        const remaining = duration - (performance.now() - started);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
        // Advance only after MongoDB confirms the choice, so failures keep the current card.
        setProfiles((previous) => previous.filter((p) => p._id !== profile._id));
        if (result.matched && result.match) {
          setMatches((previous) => [
            result.match!,
            ...previous.filter((m) => m.id !== result.match!.id),
          ]);
          setCelebration(result.match);
        }
      } catch (e) {
        if (e instanceof ApiError && (e.status === 409 || e.status === 404)) {
          setToast(
            e.code === 'DISCOVERY_PAUSED'
              ? e.message
              : e.status === 409
                ? 'That choice was already saved. Your feed is up to date.'
                : 'That profile is no longer available. Your feed has been updated.',
          );
          await load();
        } else setToast((e as Error).message);
      } finally {
        // Clearing the direction springs an unsaved card back after a failed request.
        setSwipeDirection(null);
        lock.current = false;
        setBusy(false);
      }
    },
    [profiles, celebration, loading, load, preferences.paused],
  );
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (
        tab !== 'discover' ||
        view !== 'feed' ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        document.querySelector('dialog[open]') ||
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLInputElement
      )
        return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        void swipe('like');
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        void swipe('pass');
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [swipe, tab, view]);
  // Refresh shared server state on returning from another tab; never refresh during a pending swipe.
  useEffect(() => {
    function focus() {
      if (!lock.current && !celebration && !document.querySelector('dialog[open]')) void load();
    }
    window.addEventListener('focus', focus);
    return () => window.removeEventListener('focus', focus);
  }, [load, celebration]);

  return {
    profiles,
    matches,
    loading,
    error,
    toast,
    setToast,
    busy,
    celebration,
    setCelebration,
    swipeDirection,
    load,
    swipe,
    preferences,
    preferenceOptions,
    savePreferences,
  };
}
