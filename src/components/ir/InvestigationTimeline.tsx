"use client";

import { motion } from "motion/react";
import {
  AlertCircle,
  Clock3,
  Globe2,
  Laptop2,
  Terminal,
  UserRound,
} from "lucide-react";

type TimelineEvent = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low";
  type: "identity" | "process" | "network" | "endpoint";
};

interface InvestigationTimelineProps {
  events: TimelineEvent[];
  selectedEventId: string;
  onSelect: (id: string) => void;
}

const severityColor = {
  critical: "text-[#FF5364]",
  high: "text-[#FFB84D]",
  medium: "text-[#4F8CFF]",
  low: "text-[#35D6A1]",
};

const severityDot = {
  critical: "bg-[#FF5364]",
  high: "bg-[#FFB84D]",
  medium: "bg-[#4F8CFF]",
  low: "bg-[#35D6A1]",
};

const eventIcons = {
  identity: UserRound,
  process: Terminal,
  network: Globe2,
  endpoint: Laptop2,
};

export function InvestigationTimeline({
  events,
  selectedEventId,
  onSelect,
}: InvestigationTimelineProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex items-center justify-between border-b border-[#263441] px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#4F8CFF]" />
            <h2 className="text-sm font-semibold tracking-tight text-[#F5F7FA]">
              Investigation Timeline
            </h2>
          </div>

          <p className="mt-1 text-[12px] text-[#69727E]">
            Correlated events reconstructed from investigation telemetry
          </p>
        </div>

        <div className="rounded-md border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] px-2.5 py-1.5 text-[11px] font-medium text-[#4F8CFF]">
          {events.length} EVENTS
        </div>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute bottom-6 left-[52px] top-6 w-px bg-[#263441]" />

          <div className="space-y-1">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type];
              const selected = selectedEventId === event.id;

              return (
                <motion.button
                  key={event.id}
                  type="button"
                  onClick={() => onSelect(event.id)}
                  className={`relative flex w-full items-start gap-4 rounded-lg border p-3 text-left transition ${
                    selected
                      ? "border-[#4F8CFF]/25 bg-[#4F8CFF]/[0.05] shadow-[inset_2px_0_0_#4F8CFF]"
                      : "border-transparent hover:bg-white/[0.018]"
                  }`}
                >
                  <div className="relative z-10 flex w-[52px] shrink-0 flex-col items-center">
                    <span
                      className={`mt-2 h-2 w-2 rounded-full ring-4 ring-[#0B1016] ${severityDot[event.severity]}`}
                    />

                    {index !== events.length - 1 && (
                      <span className="absolute top-6 h-full w-px bg-[#263441]" />
                    )}
                  </div>

                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                      selected
                        ? "border-[#4F8CFF]/30 bg-[#4F8CFF]/[0.07]"
                        : "border-[#263441] bg-[#101720]"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        selected
                          ? "text-[#4F8CFF]"
                          : severityColor[event.severity]
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[12px] text-[#69727E]">
                        {event.timestamp}
                      </span>

                      <span
                        className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${
                          severityColor[event.severity]
                        }`}
                      >
                        {event.severity}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] font-medium text-[#F5F7FA]">
                      {event.title}
                    </div>

                    <div className="mt-1 text-[11px] leading-4 text-[#69727E]">
                      {event.description}
                    </div>

                    <div className="mt-2 text-[10px] text-[#464D56]">
                      Source &middot; {event.source}
                    </div>
                  </div>

                  {selected && (
                    <motion.div
                      layoutId="timeline-selected"
                      className="absolute right-3 top-1/2 h-7 w-0.5 -translate-y-1/2 rounded-full bg-[#4F8CFF]"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#263441] px-5 py-3">
        <div className="flex items-center gap-2 text-[10px] text-[#59616D]">
          <AlertCircle className="h-3 w-3" />
          Select an event to inspect its context
        </div>

        <button
          type="button"
          className="text-[11px] font-medium text-[#4F8CFF] hover:text-[#6AA5FF]"
        >
          View full timeline
        </button>
      </div>
    </section>
  );
}
