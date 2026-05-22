import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Skip Order Encounter — Wizlo Sample',
  description: 'Create an encounter without auto order creation via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
