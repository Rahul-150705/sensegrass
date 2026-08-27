'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from '@/components/LandingPage';
import { getCurrentUser } from '@/lib/auth';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    getCurrentUser().then((session) => {
      if (session) {
        router.replace('/dashboard');
      }
    });
  }, [router]);

  // Always render the public marketing page. Logged-in visitors are bounced
  // to /dashboard as soon as the session check above resolves.
  return <LandingPage />;
}
