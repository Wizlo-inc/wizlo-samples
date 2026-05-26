import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Update Appointment Status — Wizlo Sample',
  description: 'Update the status of an appointment via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
