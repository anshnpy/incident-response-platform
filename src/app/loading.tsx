export default function Loading() {
  return (
    <main className="min-h-screen bg-[#06080C] px-4 py-8 text-[#F5F7FA] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-28 rounded bg-[#17212B]" />
          <div className="h-8 w-56 rounded bg-[#17212B]" />
          <div className="h-3 w-96 max-w-full rounded bg-[#101720]" />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-xl border border-[#263441] bg-[#101720]"
              />
            ))}
          </div>

          <div className="h-72 rounded-xl border border-[#263441] bg-[#101720]" />
        </div>
      </div>
    </main>
  );
}
