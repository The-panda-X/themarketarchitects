'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GoBackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 border border-white/[0.12] text-text-secondary px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-white/[0.04] transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Go Back
    </button>
  );
}
