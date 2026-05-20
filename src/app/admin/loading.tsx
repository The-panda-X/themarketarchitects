import { SkeletonStatCards } from '@/components/ui/Skeleton';
import Skeleton from '@/components/ui/Skeleton';

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <SkeletonStatCards count={4} />
      <Skeleton variant="card" className="h-80" />
    </div>
  );
}
