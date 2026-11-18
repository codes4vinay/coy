'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Home, Compass } from 'lucide-react';
export function AppHeader({
  tab,
  setTab,
}: {
  tab: 'home' | 'discover';
  setTab: (tab: 'home' | 'discover') => void;
}) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label="Coy Discover home">
          <Image src="/coy-wordmark.svg" width="76" height="28" alt="Coy" />
          <span className="product-label">a little less what if.</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <button aria-current={tab === 'home' ? 'page' : undefined} onClick={() => setTab('home')}>
            <Home size={18} />
            <span>Home</span>
          </button>
          <button
            aria-current={tab === 'discover' ? 'page' : undefined}
            onClick={() => setTab('discover')}
          >
            <Compass size={18} />
            <span>Discover</span>
          </button>
        </nav>
        <span className="demo-avatar" title="Demo account" aria-label="Demo account">
          Y<span />
        </span>
      </div>
    </header>
  );
}
