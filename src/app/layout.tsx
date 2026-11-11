import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ultimate Football Manager — Tactical Career Simulation',
  description:
    'Complete browser-based football management game featuring deterministic match simulation, 2D & 3D match viewers, transfers, youth academy, and multi-season career progression.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-navy-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
