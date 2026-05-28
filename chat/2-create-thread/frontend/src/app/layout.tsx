import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Create Chat Thread — Wizlo Sample',
  description: 'Create a patient chat thread for an encounter via the Wizlo Chat API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
