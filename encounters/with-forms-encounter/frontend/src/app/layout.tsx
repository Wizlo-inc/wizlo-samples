import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Encounter with Forms — Wizlo Sample',
  description: 'Create an encounter with intake forms via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
