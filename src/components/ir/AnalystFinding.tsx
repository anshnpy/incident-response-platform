"use client";

import { motion } from "motion/react";
import {
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

interface AnalystFindingProps {
  title: string;
  description: string;
  confidence: "low" | "medium" | "high";
  status: "draft" | "confirmed" | "rejected";
  technique: string;
  evidenceCount: number;
  analyst: string;
}

export function AnalystFinding({
  title,
  description,
  confidence,
  status,
  technique,
  evidenceCount,
  analyst,
}: AnalystFindingProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex items-center justify-between border-b border-[#263441] px-5 py-4">
        <div className="flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-[#7C6CFF]" />
          <div>
            <div className="text-sm font-semibold text-[#F5F7FA]">
              Analyst Finding
            </div>
            <div className="mt-0.5 text-[10px] text-[#69727E]">
              Evidence-backed investigation conclusion
            </div>
          </div>
        </div>

        <span className="rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-[#35D6A1]">
          {status}
        </span>
      </div>

      <div className="p-5">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.035] p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.06]">
              <ShieldCheck className="h-4 w-4 text-[#7C6CFF]" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-6 text-[#F5F7FA]">
                {title}
              </h3>

              <p className="mt-2 text-[12px] leading-5 text-[#A7AFBA]">
                {description}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Meta label="Confidence" value={confidence.toUpperCase()} valueClass="text-[#35D6A1]" />
          <Meta label="Technique" value={technique} valueClass="text-[#4F8CFF]" />
          <Meta label="Evidence" value={`${evidenceCount} artifacts`} />
          <Meta label="Analyst" value={analyst} />
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-[#263441] pt-4 text-[10px] text-[#69727E]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#35D6A1]" />
          Finding is currently supported by the available investigation evidence.
        </div>
      </div>
    </section>
  );
}

function Meta({
  label,
  value,
  valueClass = "text-[#D9DEE7]",
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-lg border border-[#263441] bg-[#101720] p-3">
      <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
        {label}
      </div>

      <div className={`mt-1.5 text-[11px] font-medium ${valueClass}`}>
        {value}
      </div>
    </div>
  );
}
