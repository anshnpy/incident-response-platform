import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06080C] px-4 text-[#F5F7FA]">
      <section className="w-full max-w-[520px] rounded-2xl border border-[#263441] bg-[#0B1016] p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#263441] bg-[#101720]">
            <SearchX className="h-4 w-4 text-[#69727E]" />
          </div>

          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#59616D]">
              Route not found
            </div>

            <h1 className="mt-1.5 text-[17px] font-semibold text-[#E7ECF2]">
              Investigation view unavailable
            </h1>

            <p className="mt-2 text-[10px] leading-5 text-[#69727E]">
              The requested route or investigation resource does not exist.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="mt-5 inline-flex items-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 py-2 text-[10px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
