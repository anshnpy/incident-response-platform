"use client";

import { motion } from "motion/react";
import {
  ExternalLink,
  FileCode2,
  Globe2,
  Laptop2,
  Link2,
  ShieldAlert,
  Terminal,
  UserRound,
} from "lucide-react";

export type InvestigationEntity = {
  id: string;
  name: string;
  type: "process" | "user" | "endpoint" | "ip" | "file" | "hash";
  verdict?: "benign" | "suspicious" | "malicious";
  riskScore?: number;
  details: Record<string, string>;
  mitreTechnique?: string;
};

interface EntityInspectorProps {
  entity: InvestigationEntity;
  onOpen?: () => void;
  onMitreFocus?: (technique: string) => void;
  onInvestigate?: () => void;
}

const entityIcons = {
  process: Terminal,
  user: UserRound,
  endpoint: Laptop2,
  ip: Globe2,
  file: FileCode2,
  hash: FileCode2,
};

const verdictStyles = {
  benign: {
    text: "text-[#35D6A1]",
    border: "border-[#35D6A1]/20",
    bg: "bg-[#35D6A1]/[0.06]",
  },
  suspicious: {
    text: "text-[#FFB84D]",
    border: "border-[#FFB84D]/20",
    bg: "bg-[#FFB84D]/[0.06]",
  },
  malicious: {
    text: "text-[#FF5364]",
    border: "border-[#FF5364]/20",
    bg: "bg-[#FF5364]/[0.06]",
  },
};

export function EntityInspector({
  entity,
  onOpen,
  onMitreFocus,
  onInvestigate,
}: EntityInspectorProps) {
  const Icon = entityIcons[entity.type];

  const verdict = entity.verdict
    ? verdictStyles[entity.verdict]
    : {
        text: "text-[#8B93A1]",
        border: "border-[#263441]",
        bg: "bg-[#101720]",
      };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex items-center justify-between border-b border-[#263441] px-5 py-4">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#F5F7FA]">
            Entity Inspector
          </div>

          <div className="mt-1 text-[11px] text-[#69727E]">
            Selected investigation entity
          </div>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="rounded-lg p-1.5 text-[#59616D] transition hover:bg-white/[0.03] hover:text-white"
          aria-label="Open entity"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-5">
        <AnimateEntity entity={entity} Icon={Icon} verdict={verdict} />

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8CFF]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#69727E]">
              Details
            </span>
          </div>

          <div className="space-y-4">
            {Object.entries(entity.details).map(([label, value]) => (
              <div key={label}>
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                  {label}
                </div>

                <div className="mt-1.5 break-all text-[12px] leading-5 text-[#A7AFBA]">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {entity.mitreTechnique && (
          <div className="mt-6 border-t border-[#263441] pt-5">
            <div className="mb-3 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-[#7C6CFF]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#69727E]">
                MITRE ATT&CK
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (entity.mitreTechnique) {
                  onMitreFocus?.(entity.mitreTechnique);
                }
              }}
              className="flex w-full items-center justify-between rounded-xl border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.04] p-3 text-left transition hover:border-[#7C6CFF]/35"
            >
              <div>
                <div className="font-mono text-[11px] font-semibold text-[#7C6CFF]">
                  {entity.mitreTechnique}
                </div>

                <div className="mt-1 text-[11px] text-[#8B93A1]">
                  ATT&CK technique mapping
                </div>
              </div>

              <ExternalLink className="h-3.5 w-3.5 text-[#7C6CFF]" />
            </button>
          </div>
        )}

        {entity.riskScore !== undefined && (
          <div className="mt-6 border-t border-[#263441] pt-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                Risk Score
              </span>

              <span
                className={`text-sm font-semibold ${
                  entity.riskScore >= 90
                    ? "text-[#FF5364]"
                    : entity.riskScore >= 70
                      ? "text-[#FFB84D]"
                      : "text-[#35D6A1]"
                }`}
              >
                {entity.riskScore}
                <span className="ml-1 text-[11px] font-normal text-[#59616D]">
                  / 100
                </span>
              </span>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#263441]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${entity.riskScore}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  entity.riskScore >= 90
                    ? "bg-[#FF5364]"
                    : entity.riskScore >= 70
                      ? "bg-[#FFB84D]"
                      : "bg-[#35D6A1]"
                }`}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-2 border-t border-[#263441] pt-5">
          <button
            type="button"
            onClick={onInvestigate}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4F8CFF] px-3 py-2.5 text-[11px] font-medium text-white transition hover:bg-[#3D89FF]"
          >
            <Link2 className="h-3.5 w-3.5" />
            Investigate Entity
          </button>

          <button
            type="button"
            onClick={onOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#263441] text-[#69727E] transition hover:border-[#2A313A] hover:text-white"
            aria-label="Open entity externally"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
}

function AnimateEntity({
  entity,
  Icon,
  verdict,
}: {
  entity: InvestigationEntity;
  Icon: typeof Terminal;
  verdict: {
    text: string;
    border: string;
    bg: string;
  };
}) {
  return (
    <motion.div
      key={entity.id}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`rounded-xl border ${verdict.border} ${verdict.bg} p-4`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05]">
          <Icon className="h-4 w-4 text-[#4F8CFF]" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-[#F5F7FA]">
            {entity.name}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-[11px] capitalize text-[#69727E]">
              {entity.type}
            </span>

            {entity.verdict && (
              <span
                className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em] ${verdict.border} ${verdict.text}`}
              >
                {entity.verdict}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
