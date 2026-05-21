import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Communication Webhook — Wizlo Sample',
  description: 'Receive and display Wizlo chat message sent webhook events',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
