"use client";

import { motion } from "motion/react";
import {
  Check,
  ChevronRight,
  Circle,
  Play,
  ShieldCheck,
  Zap,
} from "lucide-react";

type PlaybookStep = {
  id: string;
  label: string;
  detail: string;
  status: "pending" | "running" | "completed";
};

interface PlaybookPanelProps {
  name: string;
  description: string;
  steps: PlaybookStep[];
  onRun?: () => void;
}

export function PlaybookPanel({
  name,
  description,
  steps,
  onRun,
}: PlaybookPanelProps) {
  const completed = steps.filter(
    (step) => step.status === "completed",
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex flex-col gap-4 border-b border-[#263441] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#7C6CFF]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F5F7FA]">
              Response Playbook
            </h2>
          </div>

          <p className="mt-1 text-[10px] text-[#69727E]">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onRun}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#7C6CFF] px-3 py-2 text-[10px] font-medium text-white transition hover:bg-[#896DFF]"
        >
          <Play className="h-3 w-3" />
          Run Playbook
        </button>
      </div>

      <div className="p-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[#F5F7FA]">
              {name}
            </span>

            <span className="text-[10px] text-[#69727E]">
              {completed}/{steps.length} complete
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#263441]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: steps.length
                  ? `${(completed / steps.length) * 100}%`
                  : "0%",
              }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full bg-[#7C6CFF]"
            />
          </div>
        </div>

        <div className="mt-6 space-y-1">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="relative flex items-start gap-3 rounded-xl border border-transparent px-2 py-2.5"
            >
              <div className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#263441] bg-[#101720]">
                {step.status === "completed" ? (
                  <Check className="h-3 w-3 text-[#35D6A1]" />
                ) : step.status === "running" ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <Circle className="h-3 w-3 text-[#FFB84D]" />
                  </motion.div>
                ) : (
                  <Circle className="h-2.5 w-2.5 text-[#59616D]" />
                )}
              </div>

              {index !== steps.length - 1 && (
                <div className="absolute left-[13px] top-9 h-[calc(100%-18px)] w-px bg-[#263441]" />
              )}

              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-[#D9DEE7]">
                  {step.label}
                </div>
                <div className="mt-1 text-[10px] leading-4 text-[#59616D]">
                  {step.detail}
                </div>
              </div>

              <span className="pt-0.5 text-[9px] uppercase text-[#59616D]">
                {step.status}
              </span>

              <ChevronRight className="mt-0.5 h-3 w-3 text-[#30343B]" />
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 border-t border-[#263441] pt-4 text-[10px] text-[#59616D]">
          <ShieldCheck className="h-3.5 w-3.5 text-[#35D6A1]" />
          All executed actions are recorded in the case audit history.
        </div>
      </div>
    </section>
  );
}
