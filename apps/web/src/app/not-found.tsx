import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="state-card">
      <h1>A little lost?</h1>
      <p>This page doesn’t exist.</p>
      <Link className="primary-button" href="/">
        Back to Discover
      </Link>
    </main>
  );
}
