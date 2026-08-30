"use client";

import {
  Check,
  Clock3,
  History,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";

export type FindingAuditEvent = {
  id: string;
  label: string;
  detail: string;
  time: string;
  tone: "info" | "success" | "warning";
};

interface FindingAuditTrailProps {
  events: FindingAuditEvent[];
}

const toneStyles = {
  info: {
    dot: "bg-[#5B8CFF]",
    text: "text-[#5B8CFF]",
    icon: Clock3,
  },
  success: {
    dot: "bg-[#43D39E]",
    text: "text-[#43D39E]",
    icon: Check,
  },
  warning: {
    dot: "bg-[#F2B84B]",
    text: "text-[#F2B84B]",
    icon: ShieldCheck,
  },
};

export function FindingAuditTrail({
  events,
}: FindingAuditTrailProps) {
  return (
    <section className="border-b border-[#1B2430] px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <History className="h-4 w-4 text-[#4DD7E8]" />

          <div>
            <h3 className="text-[14px] font-semibold text-[#E7ECF2]">
              Finding Activity
            </h3>

            <p className="mt-0.5 text-[10px] text-[#66717D]">
              Analyst actions recorded during the finding lifecycle
            </p>
          </div>
        </div>

        <span className="font-mono text-[9px] text-[#66717D]">
          {events.length} {events.length === 1 ? "event" : "events"}
        </span>
      </div>

      {events.length === 0 ? (
        <div className="mt-3 rounded-lg border border-[#1B2430] bg-[#10151C] px-3 py-3 text-[10px] text-[#66717D]">
          No finding activity recorded yet.
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <div className="relative min-w-[560px] px-1 pb-1">
            {events.length > 1 && (
              <div className="absolute left-3 right-3 top-[6px] h-px bg-[#253142]" />
            )}

            <div
              className="relative grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${events.length}, minmax(0, 1fr))`,
              }}
            >
              {events.map((event, index) => {
                const tone = toneStyles[event.tone];
                const Icon = tone.icon;

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.06,
                      ease: "easeOut",
                    }}
                    className="min-w-0"
                  >
                    <div className="relative z-10 flex h-3 items-center">
                      <span
                        className={`h-3 w-3 rounded-full border-2 border-[#0B0F14] ${tone.dot}`}
                      />
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${tone.text}`} />

                      <span className="truncate text-[10px] font-medium text-[#D7DDE5]">
                        {event.label}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="font-mono text-[9px] text-[#4DD7E8]">
                        {event.time}
                      </span>

                      <span className="h-1 w-1 rounded-full bg-[#344255]" />

                      <span
                        className={`text-[8px] font-medium uppercase tracking-[0.07em] ${tone.text}`}
                      >
                        {event.tone}
                      </span>
                    </div>

                    <p className="mt-1.5 line-clamp-2 text-[9px] leading-4 text-[#66717D]">
                      {event.detail}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
