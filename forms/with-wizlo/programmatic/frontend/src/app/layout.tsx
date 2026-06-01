import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wizlo — Programmatic Forms',
  description: 'Fill a Wizlo form in your own UI and submit it via the programmatic API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
