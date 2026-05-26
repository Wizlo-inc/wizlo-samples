import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reschedule Appointment — Wizlo Sample',
  description: 'Reschedule an appointment to a new time via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
