import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EduArena — Immersive AI-Powered Competitive Learning',
  description: 'Learn faster. Compete smarter. AI-generated courses with real-time multiplayer battles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="antialiased bg-[#0F0F1A] text-[#F8FAFC] min-h-screen">
        {children}
      </body>
    </html>
  );
}
