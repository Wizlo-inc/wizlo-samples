import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wizlo — Iframe Forms',
  description: 'Embed a Wizlo form in an iframe — Wizlo provides the UI and handles the submission',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
