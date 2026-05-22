import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Provider Network Encounter — Wizlo Sample',
  description: 'Create a provider network encounter via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
