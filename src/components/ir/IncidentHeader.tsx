"use client";

import { motion } from "motion/react";
import {
  Clock3,
  ExternalLink,
  MoreHorizontal,
  ShieldAlert,
} from "lucide-react";

import type { Incident } from "@/types/incident";

interface IncidentHeaderProps {
  incident: Incident;
}

export function IncidentHeader({
  incident,
}: IncidentHeaderProps) {
  const severity =
    incident.severity === "critical"
      ? {
          label: "CRITICAL",
          text: "text-[#FF5364]",
          bg: "bg-[#FF5364]/[0.07]",
          border: "border-[#FF5364]/20",
        }
      : incident.severity === "high"
        ? {
            label: "HIGH",
            text: "text-[#FFB84D]",
            bg: "bg-[#FFB84D]/[0.07]",
            border: "border-[#FFB84D]/20",
          }
        : incident.severity === "medium"
          ? {
              label: "MEDIUM",
              text: "text-[#F5C542]",
              bg: "bg-[#F5C542]/[0.07]",
              border: "border-[#F5C542]/20",
            }
          : {
              label: "LOW",
              text: "text-[#35D6A1]",
              bg: "bg-[#35D6A1]/[0.07]",
              border: "border-[#35D6A1]/20",
            };

  const statusLabel = incident.status.replace("-", " ");

  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex flex-col gap-5 border-b border-[#263441]/70 px-5 py-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[12px] text-[#8B93A1]">
              {incident.id}
            </span>

            <span
              className={`rounded-md border px-2 py-1 text-[11px] font-semibold tracking-[0.08em] ${severity.bg} ${severity.border} ${severity.text}`}
            >
              {severity.label}
            </span>

            <span className="flex items-center gap-1.5 rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.06] px-2 py-1 text-[11px] font-medium text-[#35D6A1]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#35D6A1]" />
              {statusLabel.toUpperCase()}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl text-[27px] font-semibold tracking-[-0.02em] text-[#E7ECF2] sm:text-3xl">
            {incident.title}
          </h1>

          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#8B95A1]">
            Active investigation into suspicious credential-access activity
            observed across identity, endpoint, and network telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 text-[11px] text-[#A7AFBA] transition hover:border-[#2A313A] hover:text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Case
          </button>

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#263441] bg-[#101720] text-[#69727E] transition hover:border-[#2A313A] hover:text-white"
            aria-label="More incident actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid divide-y divide-[#263441] sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0">
        <InfoCell label="Owner" value={incident.owner} />
        <InfoCell label="Affected User" value={incident.affectedUser} />
        <InfoCell label="Affected Host" value={incident.affectedEndpoint} />
        <InfoCell label="Attack Phase" value={incident.phase} accent="phase" />
      </div>

      <div className="grid border-t border-[#263441] lg:grid-cols-[180px_1fr_180px]">
        <div className="border-b border-[#263441] px-5 py-3.5 lg:border-b-0 lg:border-r">
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#66717D]">
            Started
          </div>

          <div className="mt-2 flex items-center gap-2 text-[12px] text-[#D9DEE7]">
            <Clock3 className="h-3.5 w-3.5 text-[#69727E]" />
            {formatDateTime(incident.startedAt)}
          </div>
        </div>

        <div className="border-b border-[#263441] px-4 py-3 lg:border-b-0">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                Risk Exposure
              </div>

              <div className="mt-1">
                <span className="text-[25px] font-semibold text-[#FF4D67]">
                  {incident.riskScore}
                </span>
                <span className="ml-1 text-[12px] text-[#59616D]">
                  / 100
                </span>
              </div>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05]">
              <ShieldAlert className="h-4 w-4 text-[#FF5364]" />
            </div>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-[#1B2632]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${incident.riskScore}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full bg-[#FF5364]"
            />
          </div>

          <div className="mt-2 flex justify-between text-[10px] text-[#59616D]">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Critical</span>
          </div>
        </div>

        <div className="p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
            Last Activity
          </div>

          <div className="mt-2 text-[12px] text-[#D9DEE7]">
            {formatDateTime(incident.updatedAt)}
          </div>

          <div className="mt-1 text-[10px] text-[#69727E]">
            Investigation active
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "phase";
}) {
  return (
    <div className="px-5 py-3.5 lg:border-r lg:border-[#263441]/70 last:border-r-0">
      <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
        {label}
      </div>

      <div
        className={`mt-2 truncate text-[12px] font-medium ${
          accent === "phase" ? "text-[#FFB84D]" : "text-[#D9DEE7]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
