'use client';
import { useEffect, useRef, useState } from 'react';
import { LockKeyhole, X, LoaderCircle } from 'lucide-react';
import type { Preferences, PreferenceOptions } from '@/lib/api';
export function PreferencesDialog({
  preferences,
  options,
  onSave,
  onClose,
}: {
  preferences: Preferences;
  options: PreferenceOptions;
  onSave: (preferences: Preferences) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Preferences>({
    ...preferences,
    interests: [...preferences.interests],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(draft);
      onClose();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="preferences-dialog"
      aria-labelledby="preferences-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <form onSubmit={(event) => void submit(event)}>
        <div className="preferences-header">
          <div>
            <span className="eyebrow">YOUR PACE. YOUR POSSIBILITIES.</span>
            <h2 id="preferences-title">A little more you.</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close preferences"
            onClick={onClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>
        <p className="preferences-intro">
          Choose what feels right. These preferences are private, and you can change them anytime.
        </p>
        <fieldset disabled={saving}>
          <label className="pause-control">
            <span>
              <strong>Pause discovery</strong>
              <small>
                Take a breather from new introductions. Your existing matches and choices stay
                saved.
              </small>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={draft.paused}
              onChange={(event) => setDraft({ ...draft, paused: event.target.checked })}
            />
          </label>
          <label className="city-control" htmlFor="preferred-city">
            Where would you like to meet people?
            <select
              id="preferred-city"
              value={draft.city}
              onChange={(event) => setDraft({ ...draft, city: event.target.value })}
            >
              <option value="">Any city</option>
              {options.cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <div className="interest-heading">
            <h3>Your interests</h3>
            <span>{draft.interests.length}/8 selected</span>
          </div>
          <p id="interest-help" className="field-help">
            Choose up to eight. We’ll introduce people who share at least one. Leave these clear to
            explore everyone.
          </p>
          <div
            className="preference-interests"
            role="group"
            aria-label="Your interests"
            aria-describedby="interest-help"
          >
            {options.interests.map((interest) => {
              const selected = draft.interests.includes(interest);
              return (
                <button
                  type="button"
                  key={interest}
                  aria-pressed={selected}
                  disabled={!selected && draft.interests.length >= 8}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      interests: selected
                        ? draft.interests.filter((value) => value !== interest)
                        : [...draft.interests, interest],
                    })
                  }
                >
                  {interest}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="text-button reset-preferences"
            onClick={() => setDraft({ paused: false, city: '', interests: [] })}
          >
            Reset to all possibilities
          </button>
        </fieldset>
        {error && (
          <p className="preferences-error" role="alert">
            {error}
          </p>
        )}
        <div className="preferences-actions">
          <span>
            <LockKeyhole size={13} />
            No precise location. No incoming-like hints.
          </span>
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoaderCircle size={16} className="spin" />
                Saving…
              </>
            ) : (
              'Save preferences'
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
