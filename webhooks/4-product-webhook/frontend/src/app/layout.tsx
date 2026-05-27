import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Product Webhook — Wizlo Sample',
  description: 'Receive and inspect Wizlo product catalog webhook events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
