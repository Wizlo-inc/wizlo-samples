import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Locations — Wizlo Sample',
  description: 'Browse countries, states, and cities-by-state via the Wizlo location utilities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
