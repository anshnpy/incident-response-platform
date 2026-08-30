"use client";

import {
  Check,
  Circle,
  ShieldCheck,
} from "lucide-react";

const phases = [
  ["Detected", "completed"],
  ["Triaged", "completed"],
  ["Investigating", "active"],
  ["Contained", "pending"],
  ["Eradicated", "pending"],
  ["Recovered", "pending"],
  ["Closed", "pending"],
] as const;

export function CaseLifecycle() {
  return (
    <section className="rounded-xl border border-[#263441] bg-[#101720]">
      <div className="border-b border-[#263441]/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#7C6CFF]" />
          <div>
            <h3 className="text-[12px] font-semibold text-[#F5F7FA]">
              Case Lifecycle
            </h3>
            <p className="mt-0.5 text-[9px] text-[#69727E]">
              Current incident response phase
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="space-y-1">
          {phases.map(([label, status], index) => (
            <div
              key={label}
              className="relative flex items-center gap-2.5 py-1.5"
            >
              {index < phases.length - 1 && (
                <div className="absolute left-[7px] top-6 h-4 w-px bg-[#263441]" />
              )}

              <div
                className={`relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  status === "completed"
                    ? "border-[#35D6A1]/30 bg-[#35D6A1]/[0.08]"
                    : status === "active"
                      ? "border-[#4F8CFF]/40 bg-[#4F8CFF]/[0.10] shadow-[0_0_10px_rgba(77,163,255,0.14)]"
                      : "border-[#263441] bg-[#17212B]"
                }`}
              >
                {status === "completed" ? (
                  <Check className="h-2.5 w-2.5 text-[#35D6A1]" />
                ) : status === "active" ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4F8CFF] shadow-[0_0_7px_rgba(77,163,255,0.7)]" />
                ) : (
                  <Circle className="h-2 w-2 text-[#3A4652]" />
                )}
              </div>

              <span
                className={`text-[10px] ${
                  status === "active"
                    ? "font-medium text-[#F5F7FA]"
                    : status === "completed"
                      ? "text-[#A7AFBA]"
                      : "text-[#59616D]"
                }`}
              >
                {label}
              </span>

              {status === "active" && (
                <span className="ml-auto rounded-md border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] px-1.5 py-0.5 text-[8px] font-medium uppercase text-[#4F8CFF]">
                  Current
                </span>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-[#263441]/70 pt-3">
          <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
            Investigation Health
          </div>

          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <Metric value="7" label="Events" />
            <Metric value="4" label="Evidence" />
            <Metric value="3" label="IOCs" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-[#263441] bg-[#17212B] px-2 py-2">
      <div className="text-[13px] font-semibold text-[#F5F7FA]">
        {value}
      </div>
      <div className="mt-0.5 text-[8px] text-[#69727E]">
        {label}
      </div>
    </div>
  );
}
