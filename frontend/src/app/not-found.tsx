import Link from 'next/link';
import { Radio } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4 space-y-4 select-none">
      <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center text-primary">
        <Radio className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white">404</h1>
      <h2 className="text-lg font-bold text-white">Track or Page Not Found</h2>
      <p className="text-xs text-muted max-w-sm">
        The song, playlist, or page you were looking for doesn't exist or has been relocated.
      </p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-black font-bold text-xs uppercase"
      >
        Return Home
      </Link>
    </div>
  );
}
