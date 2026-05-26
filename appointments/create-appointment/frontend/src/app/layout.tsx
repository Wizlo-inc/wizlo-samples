import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Create Appointment — Wizlo Sample',
  description: 'Create a new appointment via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
