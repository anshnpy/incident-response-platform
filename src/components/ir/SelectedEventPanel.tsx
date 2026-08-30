"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ArrowUpRight,
  Database,
  FileSearch,
  Globe2,
  Laptop2,
  ShieldAlert,
  Terminal,
  UserRound,
} from "lucide-react";

type EvidenceItem = {
  id: string;
  name: string;
  type: string;
  source: string;
  collected: string;
  size?: string;
  relevance: "high" | "medium" | "low";
};

type SelectedEvent = {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  source: string;
  severity: "critical" | "high" | "medium" | "low";
  host: string;
  user: string;
  process: string;
  technique: string;
  tactic: string;
  riskScore: number;
  eventId: string;
};

interface SelectedEventPanelProps {
  event: SelectedEvent | null;
  evidence: EvidenceItem[];
}

const severityStyles = {
  critical: {
    text: "text-[#FF5364]",
    border: "border-[#FF5364]/25",
    bg: "bg-[#FF5364]/[0.06]",
  },
  high: {
    text: "text-[#FFB84D]",
    border: "border-[#FFB84D]/25",
    bg: "bg-[#FFB84D]/[0.06]",
  },
  medium: {
    text: "text-[#4F8CFF]",
    border: "border-[#4F8CFF]/25",
    bg: "bg-[#4F8CFF]/[0.06]",
  },
  low: {
    text: "text-[#35D6A1]",
    border: "border-[#35D6A1]/25",
    bg: "bg-[#35D6A1]/[0.06]",
  },
} as const;

const sourceIcons = {
  Identity: UserRound,
  EDR: Terminal,
  Network: Globe2,
  Endpoint: Laptop2,
  File: FileSearch,
  System: Activity,
};

export function SelectedEventPanel({
  event,
  evidence,
}: SelectedEventPanelProps) {
  if (!event) {
    return (
      <section className="flex min-h-[520px] items-center justify-center rounded-2xl border border-[#263441] bg-[#0B1016] p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl border border-[#263441] bg-[#101720]">
            <Activity className="h-5 w-5 text-[#59616D]" />
          </div>

          <div className="mt-4 text-sm font-semibold text-[#D9DEE7]">
            No event selected
          </div>

          <p className="mt-2 text-[12px] leading-5 text-[#69727E]">
            Select an event from the investigation timeline to inspect its
            forensic context.
          </p>
        </div>
      </section>
    );
  }

  const severity = severityStyles[event.severity];
  const SourceIcon = sourceIcons[event.source as keyof typeof sourceIcons] ?? Activity;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex flex-col gap-4 border-b border-[#263441] px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
              Selected Event
            </span>

            <span
              className={`rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${severity.border} ${severity.bg} ${severity.text}`}
            >
              {event.severity}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-lg border ${severity.border} ${severity.bg}`}
            >
              <SourceIcon className={`h-4 w-4 ${severity.text}`} />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight text-[#F5F7FA]">
                {event.title}
              </h2>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-[#69727E]">
                <span className="font-mono">{event.timestamp}</span>
                <span>•</span>
                <span>{event.source}</span>
                <span>•</span>
                <span>Event {event.eventId}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 text-[11px] text-[#A7AFBA] transition hover:border-[#2A313A] hover:text-white"
        >
          Open event
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="border-b border-[#263441] p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18 }}
          >
            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
              <Info label="Timestamp" value={event.timestamp} />
              <Info label="Host" value={event.host} />
              <Info label="User" value={event.user} />
              <Info label="Process" value={event.process} />
              <Info label="Technique" value={event.technique} accent="blue" />
              <Info label="Tactic" value={event.tactic} />
              <Info label="Source" value={event.source} />
              <Info label="Event ID" value={event.eventId} mono />
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_240px]">
              <div className="rounded-xl border border-[#263441] bg-[#08090B] p-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                  Description
                </div>

                <p className="mt-2 text-[12px] leading-5 text-[#A7AFBA]">
                  {event.description}
                </p>
              </div>

              <div className="rounded-xl border border-[#263441] bg-[#08090B] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                    Risk Score
                  </span>

                  <ShieldAlert className="h-3.5 w-3.5 text-[#FF5364]" />
                </div>

                <div className="mt-2">
                  <span className="text-2xl font-semibold text-[#FF5364]">
                    {event.riskScore}
                  </span>

                  <span className="ml-1 text-[12px] text-[#59616D]">
                    / 100
                  </span>
                </div>

                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#263441]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${event.riskScore}%` }}
                    transition={{ duration: 0.65, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#FF5364]"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-[#4F8CFF]" />
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#F5F7FA]">
                Evidence
              </h3>
            </div>

            <p className="mt-1 text-[10px] text-[#69727E]">
              Artifacts supporting the selected event
            </p>
          </div>

          <span className="rounded-md border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] px-2 py-1 text-[10px] text-[#4F8CFF]">
            {evidence.length} ITEMS
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {evidence.map((item) => (
            <motion.button
              key={item.id}
              type="button"
              whileHover={{ y: -1 }}
              className="group rounded-xl border border-[#263441] bg-[#101720] p-3 text-left transition hover:border-[#2A313A]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#4F8CFF]/15 bg-[#4F8CFF]/[0.04]">
                  <FileSearch className="h-3.5 w-3.5 text-[#4F8CFF]" />
                </div>

                <ArrowUpRight className="h-3 w-3 text-[#464D56] transition group-hover:text-[#A7AFBA]" />
              </div>

              <div className="mt-3 truncate text-[11px] font-medium text-[#D9DEE7]">
                {item.name}
              </div>

              <div className="mt-1 text-[10px] text-[#69727E]">
                {item.type}
              </div>

              <div className="mt-3 space-y-1.5 border-t border-[#263441] pt-3">
                <div className="flex justify-between gap-2">
                  <span className="text-[9px] text-[#59616D]">
                    Source
                  </span>
                  <span className="truncate text-[9px] text-[#8B93A1]">
                    {item.source}
                  </span>
                </div>

                <div className="flex justify-between gap-2">
                  <span className="text-[9px] text-[#59616D]">
                    Collected
                  </span>
                  <span className="text-[9px] text-[#8B93A1]">
                    {item.collected}
                  </span>
                </div>

                {item.size && (
                  <div className="flex justify-between gap-2">
                    <span className="text-[9px] text-[#59616D]">
                      Size
                    </span>
                    <span className="text-[9px] text-[#8B93A1]">
                      {item.size}
                    </span>
                  </div>
                )}

                <div className="flex justify-between gap-2">
                  <span className="text-[9px] text-[#59616D]">
                    Relevance
                  </span>
                  <span
                    className={`text-[9px] font-semibold uppercase ${
                      item.relevance === "high"
                        ? "text-[#35D6A1]"
                        : item.relevance === "medium"
                          ? "text-[#FFB84D]"
                          : "text-[#69727E]"
                    }`}
                  >
                    {item.relevance}
                  </span>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Info({
  label,
  value,
  accent,
  mono,
}: {
  label: string;
  value: string;
  accent?: "blue";
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
        {label}
      </div>

      <div
        className={`mt-1.5 break-all text-[12px] ${
          mono ? "font-mono" : ""
        } ${accent === "blue" ? "text-[#4F8CFF]" : "text-[#A7AFBA]"}`}
      >
        {value}
      </div>
    </div>
  );
}
