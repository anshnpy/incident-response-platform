"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  Shield,
  Target,
} from "lucide-react";

interface MITREPanelProps {
  technique: string;
  tactic: string;
  techniqueName: string;
  confidence: "low" | "medium" | "high";
  eventCount: number;
  evidenceCount: number;
}

export function MITREPanel({
  technique,
  tactic,
  techniqueName,
  confidence,
  eventCount,
  evidenceCount,
}: MITREPanelProps) {
  const confidenceColor =
    confidence === "high"
      ? "text-[#35D6A1]"
      : confidence === "medium"
        ? "text-[#FFB84D]"
        : "text-[#69727E]";

  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex items-center justify-between border-b border-[#263441] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#7C6CFF]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F5F7FA]">
              MITRE ATT&CK
            </h2>
          </div>

          <p className="mt-1 text-[10px] text-[#69727E]">
            Technique mapping for the active investigation
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg p-1.5 text-[#59616D] transition hover:bg-white/[0.03] hover:text-white"
          aria-label="Open MITRE technique"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-5">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.04] p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-mono text-sm font-semibold text-[#7C6CFF]">
                {technique}
              </div>

              <div className="mt-1.5 text-[12px] font-medium text-[#D9DEE7]">
                {techniqueName}
              </div>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.05]">
              <Target className="h-4 w-4 text-[#7C6CFF]" />
            </div>
          </div>

          <div className="mt-4 border-t border-[#7C6CFF]/10 pt-3">
            <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#69727E]">
              Tactic
            </div>

            <div className="mt-1 text-[11px] text-[#A7AFBA]">
              {tactic}
            </div>
          </div>
        </motion.div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric label="Confidence" value={confidence} valueClass={confidenceColor} />
          <Metric label="Events" value={String(eventCount)} />
          <Metric label="Evidence" value={String(evidenceCount)} />
        </div>

        <button
          type="button"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 py-2.5 text-[11px] text-[#A7AFBA] transition hover:border-[#2A313A] hover:text-white"
        >
          View ATT&CK technique
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </section>
  );
}

function Metric({
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
      <div className="text-[9px] uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </div>

      <div
        className={`mt-1.5 text-[12px] font-semibold capitalize ${valueClass}`}
      >
        {value}
      </div>
    </div>
  );
}
