import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'List Chat Threads — Wizlo Sample',
  description: 'List and filter chat threads via the Wizlo Chat API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
