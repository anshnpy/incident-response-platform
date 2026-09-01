"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#06080C] px-4 text-[#F5F7FA]">
      <section className="w-full max-w-[520px] rounded-2xl border border-[#FF5364]/20 bg-[#0B1016] p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05]">
            <AlertTriangle className="h-4 w-4 text-[#FF5364]" />
          </div>

          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#FF5364]">
              Dashboard error
            </div>

            <h1 className="mt-1.5 text-[17px] font-semibold text-[#E7ECF2]">
              This workspace could not be loaded
            </h1>

            <p className="mt-2 text-[10px] leading-5 text-[#69727E]">
              Something went wrong while rendering this view. Retry the
              current route without leaving the investigation workspace.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#4F8CFF] px-3 py-2 text-[10px] font-medium text-white transition hover:bg-[#62AEFF]"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      </section>
    </main>
  );
}
