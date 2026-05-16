import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect visitors from the root page directly to the dashboard.
  // Our middleware will handle sending unauthenticated users to /login automatically.
  redirect('/dashboard');
}
