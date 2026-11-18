'use client';
import { useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Sparkles } from 'lucide-react';
import type { Match } from '@/lib/api';
import { Portrait } from './portrait';
import { ConversationStarter } from './conversation-starter';
export function MatchDialog({
  match,
  onContinue,
  onMatches,
}: {
  match: Match;
  onContinue: () => void;
  onMatches: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    return () => {
      element?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className="match-dialog"
      onCancel={onContinue}
      aria-labelledby="match-title"
    >
      <motion.div
        className="match-content"
        initial={{ scale: reduced ? 1 : 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <span className="celebrate-star star-one" aria-hidden="true">
          ✳
        </span>
        <span className="celebrate-star star-two" aria-hidden="true">
          ✧
        </span>
        <span className="eyebrow">
          <Sparkles size={16} /> A LITTLE COURAGE. A REAL CONNECTION.
        </span>
        <h2 id="match-title">It’s a match!</h2>
        <p>Turns out, the feeling is mutual.</p>
        <div className="match-portrait">
          <Portrait src={match.profile.photo} name={match.profile.name} />
          <span>
            <Heart fill="currentColor" size={26} />
          </span>
        </div>
        <h3>
          {match.profile.name}, {match.profile.age}
        </h3>
        <p>
          Your secret is now a shared one.
          <br />
          Here’s to something lovely.
        </p>
        <ConversationStarter starter={match.conversationStarter} />
        <button className="primary-button" onClick={onMatches} autoFocus>
          View all matches <Heart size={17} />
        </button>
        <button className="text-button" onClick={onContinue}>
          Keep discovering <span>→</span>
        </button>
        <small>Only mutual feelings are ever revealed.</small>
      </motion.div>
    </dialog>
  );
}
