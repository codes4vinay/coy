'use client';
import { useState } from 'react';
import { MessageCircle, Copy, Check } from 'lucide-react';
import type { Match } from '@/lib/api';
export function ConversationStarter({ starter }: { starter: Match['conversationStarter'] }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(starter.text);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  return (
    <details className="conversation-starter">
      <summary>
        <MessageCircle size={16} />A little help breaking the ice<span>+</span>
      </summary>
      <div className="conversation-body">
        <span className="conversation-context">
          {starter.interest
            ? `You both enjoy ${starter.interest.toLowerCase()}`
            : 'A little place to start'}
        </span>
        <blockquote>{starter.text}</blockquote>
        <button type="button" className="copy-prompt" onClick={() => void copy()}>
          {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy prompt'}
        </button>
        <small>Optional, of course. Share it wherever you already talk.</small>
        {copyError && (
          <p role="status">
            Couldn’t copy automatically. You can select and copy the prompt above.
          </p>
        )}
      </div>
    </details>
  );
}
