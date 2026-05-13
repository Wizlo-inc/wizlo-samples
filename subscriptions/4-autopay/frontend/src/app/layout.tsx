import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Autopay Management — Wizlo Sample',
  description: 'Configure autopay, manage payment methods, and retry failed payments via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
