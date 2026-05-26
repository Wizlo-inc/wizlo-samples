import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Update Appointment — Wizlo Sample',
  description: 'Update an existing appointment via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
