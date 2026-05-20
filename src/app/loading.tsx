export default function RootLoading() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent-primary/20 border-t-accent-primary animate-spin" />
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    </div>
  );
}
