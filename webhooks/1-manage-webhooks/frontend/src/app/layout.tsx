import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Manage Webhooks — Wizlo Sample',
  description: 'Create and manage webhook configurations via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
