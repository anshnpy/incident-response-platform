"use client";

import { motion } from "motion/react";
import { ChevronRight, GitBranch, Network } from "lucide-react";

interface CorrelationEvent {
  id: string;
  time: string;
  title: string;
  source: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface EventCorrelationPanelProps {
  events: CorrelationEvent[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const severityClass = {
  low: "text-[#43D39E]",
  medium: "text-[#5B8CFF]",
  high: "text-[#F2B84B]",
  critical: "text-[#FF4D67]",
};

const severityDot = {
  low: "bg-[#43D39E]",
  medium: "bg-[#5B8CFF]",
  high: "bg-[#F2B84B]",
  critical: "bg-[#FF4D67]",
};

export function EventCorrelationPanel({
  events,
  selectedId,
  onSelect,
}: EventCorrelationPanelProps) {
  return (
    <section className="border-b border-[#1B2430] bg-[#0B0F14]">
      <div className="flex items-center justify-between border-b border-[#1B2430] px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#4DD7E8]/15 bg-[#4DD7E8]/[0.035]">
            <GitBranch className="h-3.5 w-3.5 text-[#4DD7E8]" />
          </div>

          <div>
            <h3 className="text-[14px] font-semibold text-[#E7ECF2]">
              Event Correlation
            </h3>

            <p className="mt-0.5 text-[10px] text-[#66717D]">
              Chronological relationships across the investigation
            </p>
          </div>
        </div>

        <span className="font-mono text-[9px] text-[#66717D]">
          {events.length} correlated events
        </span>
      </div>

      {events.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <Network className="mx-auto h-4 w-4 text-[#3A4652]" />
          <div className="mt-2 text-[10px] text-[#66717D]">
            No correlated activity found.
          </div>
        </div>
      ) : (
        <div className="px-5 py-3">
          <div className="relative w-full max-w-[1120px]">
            <div className="absolute left-[8px] top-3 bottom-3 w-px bg-[#253142]" />

            <div className="space-y-0.5">
              {events.map((event, index) => {
                const selected = event.id === selectedId;

                return (
                  <motion.button
                    key={event.id}
                    type="button"
                    onClick={() => onSelect(event.id)}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    className={`group relative flex w-full items-center gap-3 rounded-lg border px-2.5 py-2.5 text-left transition ${
                      selected
                        ? "border-[#4DD7E8]/15 bg-[#4DD7E8]/[0.035]"
                        : "border-transparent hover:bg-white/[0.018]"
                    }`}
                  >
                    <div className="relative z-10 flex w-3 shrink-0 justify-center">
                      <span
                        className={`h-2 w-2 rounded-full border-2 border-[#0B0F14] ${severityDot[event.severity]} ${
                          selected
                            ? "shadow-[0_0_7px_rgba(77,215,232,0.55)]"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="flex w-[78px] shrink-0 items-center">
                      <span className="font-mono text-[10px] text-[#66717D]">
                        {event.time}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-[12px] font-medium ${
                          selected ? "text-[#E7ECF2]" : "text-[#D7DDE5]"
                        }`}
                      >
                        {event.title}
                      </div>

                      <div className="mt-0.5 text-[9px] uppercase tracking-[0.07em] text-[#596674]">
                        {event.source}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4">
                      <span
                        className={`w-[54px] text-right text-[9px] font-semibold uppercase tracking-[0.05em] ${severityClass[event.severity]}`}
                      >
                        {event.severity}
                      </span>

                      <ChevronRight
                        className={`h-3.5 w-3.5 transition ${
                          selected
                            ? "text-[#4DD7E8]"
                            : "text-[#344255] opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-[#1B2430] px-5 py-2 text-[9px] text-[#66717D]">
        Correlation uses shared time, host, identity, process, network, and
        technique context.
      </div>
    </section>
  );
}
