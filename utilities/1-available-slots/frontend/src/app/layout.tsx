import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Available Slots — Wizlo Sample',
  description: 'Fetch provider telehealth slots and PSC lab slots via the Wizlo available-slots utility',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
