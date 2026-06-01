import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Real-time Chat (Kafka) — Wizlo Sample',
  description: 'Consume real-time chat-message events from a Wizlo Kafka topic',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
