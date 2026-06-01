import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Provider Network Chats — Wizlo Sample',
  description: 'Aggregate chat threads across clinics for a provider-network tenant',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
