export function InvestigationSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-[#263441] bg-[#0D1117] p-4">
      <div className="h-3 w-32 rounded bg-[#17212B]" />
      <div className="mt-4 h-8 w-3/4 rounded bg-[#17212B]" />
      <div className="mt-3 h-3 w-full rounded bg-[#17212B]" />
      <div className="mt-2 h-3 w-5/6 rounded bg-[#17212B]" />

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="h-12 rounded-lg bg-[#17212B]" />
        <div className="h-12 rounded-lg bg-[#17212B]" />
        <div className="h-12 rounded-lg bg-[#17212B]" />
      </div>
    </div>
  );
}
