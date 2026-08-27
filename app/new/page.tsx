import { redirect } from 'next/navigation';

// The "start a project" console now lives on the dashboard. Keep /new as a
// stable entry point (nav, deep links) that lands there.
export default function NewProjectPage() {
  redirect('/dashboard');
}
