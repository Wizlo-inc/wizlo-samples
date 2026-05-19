/**
 * Module:    Refills / Edge Cases
 * Workflow:  Frontend root layout
 * File:      app/layout.tsx
 * Author:    Abhay Panchal <abhay.panchal@techdome.net.in>
 * Date:      2026-05-19
 */
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wizlo Refills — Edge Cases',
  description: 'Failure-mode handling for the Wizlo Refills workflow',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="app-nav">
          <div className="nav-inner">
            <span className="brand">Wizlo Refills · Edge Cases</span>
            <a href="http://localhost:3013" target="_blank" rel="noreferrer">
              ← Main refills app
            </a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
