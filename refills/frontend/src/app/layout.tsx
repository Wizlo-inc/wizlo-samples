/**
 * Module:    Refills
 * Workflow:  Frontend root layout
 * File:      app/layout.tsx
 * Author:    Abhay Panchal
 * Date:      2026-05-18
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wizlo Refills Sample',
  description: 'End-to-end refill workflow against the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="app-nav">
          <div className="nav-inner">
            <span className="brand">Wizlo Refills</span>
            <Link href="/">Overview</Link>
            <Link href="/eligibility">1. Eligibility</Link>
            <Link href="/create-refill">2. Create Refill</Link>
            <Link href="/rx-submission">3. Rx Submission</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
