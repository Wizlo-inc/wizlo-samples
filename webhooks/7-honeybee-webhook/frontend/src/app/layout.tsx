import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Honeybee Webhook — Wizlo Sample',
  description: 'Receive and inspect raw Honeybee prescription (RX) webhook events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
