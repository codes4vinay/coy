'use client';
import { Heart, MapPin, ArrowUpRight } from 'lucide-react';
import type { Match } from '@/lib/api';
import { Portrait } from './portrait';
import { ConversationStarter } from './conversation-starter';
export function Matches({ matches, onDiscover }: { matches: Match[]; onDiscover: () => void }) {
  if (!matches.length)
    return (
      <div className="state-card">
        <span className="state-icon">
          <Heart />
        </span>
        <h2>Good things take two.</h2>
        <p>
          When you both like each other, your connection will appear here. Until then, your feelings
          stay private.
        </p>
        <button className="primary-button" onClick={onDiscover}>
          Meet someone new <ArrowUpRight size={18} />
        </button>
      </div>
    );
  return (
    <div className="matches-grid">
      {matches.map((match) => (
        <article className="match-tile" key={match.id}>
          <div className="match-tile-image">
            <Portrait src={match.profile.photo} name={match.profile.name} />
            <span>
              <Heart size={15} fill="currentColor" /> Mutual connection
            </span>
          </div>
          <div className="match-tile-copy">
            <h2>
              {match.profile.name}, {match.profile.age}
            </h2>
            <p>
              <MapPin size={14} />
              {match.profile.city}
            </p>
            <small>{match.profile.college}</small>
            <ConversationStarter starter={match.conversationStarter} />
          </div>
        </article>
      ))}
    </div>
  );
}
