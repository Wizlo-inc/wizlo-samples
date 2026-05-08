import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wizlo Orders Sample',
  description: 'Create and view orders via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
