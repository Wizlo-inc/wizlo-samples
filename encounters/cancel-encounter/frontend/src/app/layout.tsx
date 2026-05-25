import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cancel Encounter — Wizlo Sample',
  description: 'Check encounter status and cancel an encounter via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
