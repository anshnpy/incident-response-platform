"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 py-2 text-[9px] font-medium text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
    >
      <Printer className="h-3.5 w-3.5" />
      Print / Export
    </button>
  );
}
