import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Subscription Enrollment — Wizlo Sample',
  description: 'Enroll a patient into a subscription plan and collect payment via Gr4vy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
