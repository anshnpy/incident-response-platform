"use client";

import { motion } from "motion/react";
import {
  ArrowUpRight,
  Globe2,
  Hash,
  Link2,
} from "lucide-react";

type IOC = {
  id: string;
  value: string;
  type: "IP" | "Domain" | "Hash" | "URL";
  verdict: "malicious" | "suspicious" | "benign";
  risk: number;
  sightings: number;
};

interface RelatedIOCsProps {
  iocs: IOC[];
}

const verdictStyles = {
  malicious: {
    text: "text-[#FF5364]",
    border: "border-[#FF5364]/20",
    bg: "bg-[#FF5364]/[0.05]",
  },
  suspicious: {
    text: "text-[#FFB84D]",
    border: "border-[#FFB84D]/20",
    bg: "bg-[#FFB84D]/[0.05]",
  },
  benign: {
    text: "text-[#35D6A1]",
    border: "border-[#35D6A1]/20",
    bg: "bg-[#35D6A1]/[0.05]",
  },
};

export function RelatedIOCs({
  iocs,
}: RelatedIOCsProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex items-center justify-between border-b border-[#263441] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-[#35D6FF]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F5F7FA]">
              Related IOCs
            </h2>
          </div>

          <p className="mt-1 text-[10px] text-[#69727E]">
            Indicators connected to this investigation
          </p>
        </div>

        <span className="rounded-md border border-[#35D6FF]/20 bg-[#35D6FF]/[0.04] px-2 py-1 text-[10px] text-[#35D6FF]">
          {iocs.length}
        </span>
      </div>

      <div className="space-y-2 p-3">
        {iocs.map((ioc) => {
          const verdict = verdictStyles[ioc.verdict];
          const Icon =
            ioc.type === "IP"
              ? Globe2
              : ioc.type === "Hash"
                ? Hash
                : Link2;

          return (
            <motion.button
              key={ioc.id}
              type="button"
              whileHover={{ x: 2 }}
              className="group flex w-full items-center gap-3 rounded-xl border border-[#263441] bg-[#101720] p-3 text-left transition hover:border-[#2A313A]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#35D6FF]/15 bg-[#35D6FF]/[0.03]">
                <Icon className="h-3.5 w-3.5 text-[#35D6FF]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[11px] text-[#D9DEE7]">
                  {ioc.value}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-[#59616D]">
                    {ioc.type}
                  </span>

                  <span
                    className={`rounded border px-1.5 py-0.5 text-[9px] uppercase ${verdict.border} ${verdict.bg} ${verdict.text}`}
                  >
                    {ioc.verdict}
                  </span>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-[9px] text-[#59616D]">
                  Risk
                </div>

                <div
                  className={`mt-1 text-[12px] font-semibold ${
                    ioc.risk >= 90
                      ? "text-[#FF5364]"
                      : ioc.risk >= 70
                        ? "text-[#FFB84D]"
                        : "text-[#35D6A1]"
                  }`}
                >
                  {ioc.risk}
                </div>

                <div className="mt-1 text-[9px] text-[#464D56]">
                  {ioc.sightings} sightings
                </div>
              </div>

              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#30343B] transition group-hover:text-[#A7AFBA]" />
            </motion.button>
          );
        })}
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 border-t border-[#263441] px-4 py-3 text-[10px] text-[#35D6FF] hover:text-[#58D4E5]"
      >
        View all indicators
        <ArrowUpRight className="h-3 w-3" />
      </button>
    </section>
  );
}
