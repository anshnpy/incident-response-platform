"use client";

import { motion } from "motion/react";
import {
  Activity,
  Database,
  KeyRound,
  Network,
  Server,
  ShieldAlert,
} from "lucide-react";

type IncidentRiskFactor = {
  label: string;
  value: number;
  icon: "asset" | "ioc" | "privilege" | "mitre" | "lateral" | "data";
  reason: string;
};

interface IncidentRiskProps {
  factors: IncidentRiskFactor[];
}

const icons = {
  asset: Server,
  ioc: Network,
  privilege: KeyRound,
  mitre: ShieldAlert,
  lateral: Activity,
  data: Database,
};

export function IncidentRisk({ factors }: IncidentRiskProps) {
  const factorTotal = factors.reduce(
    (total, factor) => total + factor.value,
    0,
  );

  const score = Math.min(100, factorTotal + 6);

  const level =
    score >= 90
      ? "CRITICAL"
      : score >= 70
        ? "HIGH"
        : score >= 40
          ? "MEDIUM"
          : "LOW";

  const levelClass =
    score >= 90
      ? "text-[#FF4D67]"
      : score >= 70
        ? "text-[#F2B84B]"
        : "text-[#43D39E]";

  const barClass =
    score >= 90
      ? "bg-[#FF4D67]"
      : score >= 70
        ? "bg-[#F2B84B]"
        : "bg-[#43D39E]";

  return (
    <section className="border-b border-[#1B2430] px-5 py-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#66717D]">
            Incident Risk
          </div>

          <div className="mt-1 text-[11px] text-[#66717D]">
            Case-level risk assessment
          </div>
        </div>

        <div className="text-right">
          <div
            className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${levelClass}`}
          >
            {level}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className={`mt-0.5 text-[24px] font-semibold tracking-tight ${levelClass}`}
          >
            {score}
            <span className="ml-1 text-[10px] font-normal text-[#596674]">
              /100
            </span>
          </motion.div>
        </div>
      </div>

      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-[#1B2632]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${barClass}`}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[10px]">
        <span className="text-[#596674]">
          Weighted signals
        </span>

        <span className="font-mono text-[#A7AFBA]">
          +{factorTotal}
        </span>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#66717D]">
          Risk Factors
        </div>

        <div className="divide-y divide-[#1B2430]">
          {factors.map((factor, index) => {
            const Icon = icons[factor.icon];
            const contribution =
              factorTotal > 0
                ? Math.min((factor.value / factorTotal) * 100, 100)
                : 0;

            return (
              <motion.div
                key={factor.label}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.2,
                  delay: index * 0.045,
                  ease: "easeOut",
                }}
                title={factor.reason}
                className="py-2"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#596674]" />

                  <span className="min-w-0 flex-1 truncate text-[11px] text-[#A7AFBA]">
                    {factor.label}
                  </span>

                  <span className="font-mono text-[10px] font-semibold text-[#D7DDE5]">
                    +{factor.value}
                  </span>
                </div>

                <div className="mt-1.5 ml-[22px] h-0.5 overflow-hidden rounded-full bg-[#1B2632]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${contribution}%` }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.045,
                      ease: "easeOut",
                    }}
                    className="h-full rounded-full bg-[#56657A]"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 border-l border-[#7C6CFF]/35 pl-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8B82FF]">
          Why this matters
        </div>

        <div className="mt-1 text-[10px] leading-4.5 text-[#66717D]">
          Multiple independent signals converge on a credential-access
          investigation with elevated containment priority.
        </div>
      </div>
    </section>
  );
}
