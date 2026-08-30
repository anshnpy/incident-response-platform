"use client";

import { motion } from "motion/react";
import { Activity, Database, KeyRound, Network, Server, ShieldAlert } from "lucide-react";

export interface RiskFactor {
  label: string;
  value: number;
  icon: "asset" | "ioc" | "privilege" | "mitre" | "lateral" | "data";
  reason: string;
}

interface RiskEngineProps {
  score: number;
  factors: RiskFactor[];
}

const icons = {
  asset: Server,
  ioc: Network,
  privilege: KeyRound,
  mitre: ShieldAlert,
  lateral: Activity,
  data: Database,
};

export function RiskEngine({ score, factors }: RiskEngineProps) {
  const factorTotal = factors.reduce(
    (total, factor) => total + factor.value,
    0,
  );

  const derivedScore = Math.min(
    100,
    Math.max(0, Math.round((score + factorTotal) / 2)),
  );

  const level =
    derivedScore >= 90
      ? "CRITICAL"
      : derivedScore >= 70
        ? "HIGH"
        : derivedScore >= 40
          ? "MEDIUM"
          : "LOW";

  const levelClass =
    derivedScore >= 90
      ? "text-[#FF5364]"
      : derivedScore >= 70
        ? "text-[#FFB84D]"
        : "text-[#35D6A1]";

  return (
    <section className="border-t border-[#263441]/70 pt-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#66717D]">
            Risk Engine
          </div>
          <div className="mt-1 text-[11px] text-[#66717D]">
            Explainable investigation risk
          </div>
        </div>

        <div className="text-right">
          <div className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${levelClass}`}>
            {level}
          </div>
          <div className={`mt-0.5 text-xl font-semibold ${levelClass}`}>
            {derivedScore}
            <span className="ml-1 text-[10px] font-normal text-[#59616D]">/100</span>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-[10px]">
        <span className="text-[#59616D]">
          Base entity risk {score}
        </span>

        <span className="text-[#69727E]">
          Factor contribution +{factorTotal}
        </span>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#1B2632]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${derivedScore}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${
            score >= 90
              ? "bg-[#FF5364] shadow-[0_0_8px_rgba(255,83,100,0.28)]"
              : score >= 70
                ? "bg-[#FFB84D]"
                : "bg-[#35D6A1]"
          }`}
        />
      </div>

      <div className="mt-4 space-y-1.5">
        {factors.map((factor, index) => {
          const Icon = icons[factor.icon];

          return (
            <motion.div
              key={factor.label}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.18 }}
              className="group rounded-md border border-transparent px-1 py-2 transition hover:bg-white/[0.018]"
              title={factor.reason}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-[#59616D]" />

                <span className="min-w-0 flex-1 truncate text-[11px] text-[#A7AFBA]">
                  {factor.label}
                </span>

                <span className="font-mono text-[10px] font-semibold text-[#D9DEE7]">
                  +{factor.value}
                </span>
              </div>

              <div className="mt-1.5 ml-[22px] h-0.5 overflow-hidden rounded-full bg-[#1B2632]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${factorTotal ? Math.min((factor.value / factorTotal) * 100, 100) : 0}%` }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  className="h-full rounded-full bg-[#4F8CFF]"
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
