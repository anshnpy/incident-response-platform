"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Circle,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";

export type PlaybookDrawerStep = {
  id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "completed";
};

interface PlaybookDrawerProps {
  open: boolean;
  name: string;
  description: string;
  steps: PlaybookDrawerStep[];
  running: boolean;
  completed: boolean;
  onStart: () => void;
  onClose: () => void;
}

export function PlaybookDrawer({
  open,
  name,
  description,
  steps,
  running,
  completed,
  onStart,
  onClose,
}: PlaybookDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] bg-black/55 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-[500px] flex-col border-l border-[#263441] bg-[#101720] shadow-[-20px_0_50px_rgba(0,0,0,0.4)]"
          >
            <div className="flex items-start justify-between border-b border-[#1B2430] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.05]">
                  <ShieldCheck className="h-4 w-4 text-[#7C6CFF]" />
                </div>

                <div>
                  <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#69727E]">
                    Response Playbook
                  </div>

                  <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-[#E7ECF2]">
                    {name}
                  </h2>

                  <p className="mt-1 text-[10px] leading-5 text-[#69727E]">
                    {description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#59616D] transition hover:bg-white/[0.035] hover:text-white"
                aria-label="Close playbook"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-[#263441] bg-[#17212B] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                    Execution
                  </span>

                  <span
                    className={`rounded-md border px-2 py-1 text-[8px] font-medium uppercase ${
                      completed
                        ? "border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] text-[#35D6A1]"
                        : running
                          ? "border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] text-[#4F8CFF]"
                          : "border-[#263441] bg-[#0B1016] text-[#69727E]"
                    }`}
                  >
                    {completed
                      ? "Completed"
                      : running
                        ? "Running"
                        : "Ready"}
                  </span>
                </div>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#263441]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: completed
                        ? "100%"
                        : running
                          ? "62%"
                          : `${(steps.filter((step) => step.status === "completed").length / Math.max(steps.length, 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${
  completed
    ? "bg-[#43D39E]"
    : running
      ? "bg-[#F2B84B]"
      : "bg-[#7C6CFF]"
}`}
                  />
                </div>

                <div className="mt-2 text-[9px] text-[#69727E]">
                  {steps.filter((step) => step.status === "completed").length} of{" "}
                  {steps.length} steps complete
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-[9px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                  Execution Steps
                </div>

                <div className="space-y-2">
                  {steps.map((step, index) => (
                    <div
                      key={step.id}
                      className={`relative flex gap-3 border-b border-[#1B2430] py-3 ${
                        step.status === "running"
                          ? "bg-[#F2B84B]/[0.025]"
                          : ""
                      }`}
                    >
                      <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#263441] bg-[#0B1016]">
                        {step.status === "completed" ? (
                          <Check className="h-3.5 w-3.5 text-[#35D6A1]" />
                        ) : step.status === "running" ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          >
                            <Circle className="h-3.5 w-3.5 text-[#4F8CFF]" />
                          </motion.div>
                        ) : (
                          <span className="font-mono text-[8px] text-[#59616D]">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-[#D9DEE7]">
                          {step.title}
                        </div>

                        <div className="mt-1 text-[10px] leading-5 text-[#69727E]">
                          {step.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-l border-[#F2B84B]/30 bg-[#F2B84B]/[0.02] px-3.5 py-2.5">
                <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#F2B84B]">
                  Before execution
                </div>

                <p className="mt-1.5 text-[10px] leading-4.5 text-[#8F9AA7]">
                  Review the targets and expected impact of each response step
                  before starting the automated sequence.
                </p>
              </div>
            </div>

            <div className="border-t border-[#1B2430] bg-[#0B0F14] px-4 py-3.5">
              {completed ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#43D39E] px-4 py-2.5 text-[11px] font-medium text-[#03110D]"
                >
                  <Check className="h-3.5 w-3.5" />
                  Playbook Completed
                </button>
              ) : (
                <button
                  type="button"
                  disabled={running}
                  onClick={onStart}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7C6CFF] px-4 py-2.5 text-[11px] font-medium text-white transition hover:bg-[#8B82FF] disabled:cursor-wait disabled:opacity-60"
                >
                  <Play className="h-3.5 w-3.5" />
                  {running ? "Executing Playbook..." : "Start Playbook"}
                </button>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
