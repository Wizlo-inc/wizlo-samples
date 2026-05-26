import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Shipping Webhook — Wizlo Sample',
  description: 'Receive and inspect Wizlo shipping and tracking webhook events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
