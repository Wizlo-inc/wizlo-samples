import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Notification Webhooks — Wizlo Sample',
  description: 'Receive and inspect Wizlo appointment and encounter notification webhook events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
