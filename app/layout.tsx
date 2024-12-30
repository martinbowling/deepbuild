import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { FileProvider } from '@/lib/context/FileProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeepBuild',
  description: 'AI-Powered Software Project Generator',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <FileProvider>{children}</FileProvider>
      </body>
    </html>
  );
}