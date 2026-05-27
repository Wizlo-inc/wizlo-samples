import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wizlo Products Sample',
  description: 'Manage products, categories, and subcategories via the Wizlo API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
