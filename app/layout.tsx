import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';

const roboto = Roboto({
  variable: '--font-roboto',
  display: 'swap',
  weight: ['400', '500', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Workshop Walk-In Bookings — CMS Systems',
  description: 'Counter kiosk for creating walk-in workshop bookings',
};

export const viewport: Viewport = {
  themeColor: '#31459C',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
