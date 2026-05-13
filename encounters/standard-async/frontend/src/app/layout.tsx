import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Standard Async Encounter — Wizlo Sample',
  description: 'Create a standard asynchronous encounter via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
