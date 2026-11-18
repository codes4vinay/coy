'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="state-card">
      <h1>Let’s try that again.</h1>
      <p>Something interrupted this page. Your saved choices are safe.</p>
      <button className="primary-button" onClick={reset}>
        Reload this view
      </button>
    </main>
  );
}
