import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Upload Document from URL — Wizlo Sample',
  description: 'Fetch a remote file by URL and attach it to a patient profile via the Wizlo documents utility',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
