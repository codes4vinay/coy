import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
const bricolage = localFont({
  src: '../assets/bricolage-grotesque.woff2',
  display: 'swap',
  variable: '--font-coy',
});
export const metadata: Metadata = {
  title: 'Coy — Discover',
  description: 'A little spark. A new maybe. Discover quietly; connect only when it’s mutual.',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={bricolage.variable}>{children}</body>
    </html>
  );
}
