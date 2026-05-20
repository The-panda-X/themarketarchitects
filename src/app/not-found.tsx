import Link from 'next/link';
import { Home } from 'lucide-react';
import GoBackButton from './go-back-button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <div className="relative mb-8">
          <p className="text-[10rem] font-bold font-mono text-white/[0.04] leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-6xl font-bold font-mono text-accent-primary">404</p>
          </div>
        </div>
        <h1 className="text-2xl font-heading font-bold mb-3">Page Not Found</h1>
        <p className="text-text-secondary max-w-sm mx-auto mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-accent-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" /> Go Home
          </Link>
          <GoBackButton />
        </div>
      </div>
    </div>
  );
}
