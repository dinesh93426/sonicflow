import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '../components/layout/AppShell';

export const metadata: Metadata = {
  title: 'SonicFlow — Complete Ad-Free Music Streaming',
  description: 'Pure, uninterrupted ad-free music streaming platform with lossless audio and personalized discovery.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased selection:bg-primary/30 selection:text-primary">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
