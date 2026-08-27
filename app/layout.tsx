import type { Metadata } from 'next';
import { Fraunces, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ProductForge - Website-to-Product AI Agent & SaaS Studio',
  description:
    'Transform any website into a complete SaaS product strategy, interactive blueprint, and working UI code with live AI refinement.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-neutral-950 text-neutral-100 min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
