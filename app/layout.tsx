import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
