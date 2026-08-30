"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileDown,
  Laptop2,
  Network,
  Play,
  ShieldAlert,
  UserRound,
} from "lucide-react";

type ActionStatus = "ready" | "running" | "success" | "failed";

type ResponseAction = {
  id: string;
  name: string;
  description: string;
  target: string;
  icon: "endpoint" | "identity" | "network" | "evidence";
  status: ActionStatus;
};

interface ResponsePanelProps {
  actions: ResponseAction[];
  onExecute?: (action: ResponseAction) => void;
}

const statusStyles: Record<
  ActionStatus,
  { text: string; bg: string; border: string }
> = {
  ready: {
    text: "text-[#4F8CFF]",
    bg: "bg-[#4F8CFF]/[0.05]",
    border: "border-[#4F8CFF]/20",
  },
  running: {
    text: "text-[#FFB84D]",
    bg: "bg-[#FFB84D]/[0.05]",
    border: "border-[#FFB84D]/20",
  },
  success: {
    text: "text-[#35D6A1]",
    bg: "bg-[#35D6A1]/[0.05]",
    border: "border-[#35D6A1]/20",
  },
  failed: {
    text: "text-[#FF5364]",
    bg: "bg-[#FF5364]/[0.05]",
    border: "border-[#FF5364]/20",
  },
};

const actionIcons = {
  endpoint: Laptop2,
  identity: UserRound,
  network: Network,
  evidence: FileDown,
};

export function ResponsePanel({
  actions,
  onExecute,
}: ResponsePanelProps) {
  const execute = (action: ResponseAction) => {
    onExecute?.(action);
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="flex flex-col gap-4 border-b border-[#263441] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#FF5364]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F5F7FA]">
              Response Actions
            </h2>
          </div>

          <p className="mt-1 text-[10px] text-[#69727E]">
            Execute containment and remediation from the active investigation
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            const action = actions.find((item) => item.status === "ready");
            if (action) execute(action);
          }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.07] px-3 py-2 text-[10px] font-medium text-[#4F8CFF] transition hover:bg-[#4F8CFF]/[0.12]"
        >
          <Play className="h-3 w-3" />
          Run First Ready Action
        </button>
      </div>

      <div className="divide-y divide-[#263441]">
        {actions.map((action) => {
          const Icon = actionIcons[action.icon];
          const status = statusStyles[action.status];

          return (
            <motion.div
              layout
              key={action.id}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${status.border} ${status.bg}`}
              >
                <Icon className={`h-4 w-4 ${status.text}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[12px] font-medium text-[#D9DEE7]">
                    {action.name}
                  </span>

                  <span
                    className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${status.border} ${status.bg} ${status.text}`}
                  >
                    {action.status}
                  </span>
                </div>

                <div className="mt-1 text-[10px] leading-4 text-[#69727E]">
                  {action.description}
                </div>

                <div className="mt-2 flex items-center gap-1.5 text-[9px] text-[#59616D]">
                  <span>Target</span>
                  <span className="text-[#8B93A1]">{action.target}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={action.status === "running"}
                onClick={() => execute(action)}
                className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border px-3 text-[10px] transition ${
                  action.status === "running"
                    ? "cursor-wait border-[#263441] bg-[#101720] text-[#59616D]"
                    : "border-[#263441] bg-[#101720] text-[#A7AFBA] hover:border-[#2A313A] hover:text-white"
                }`}
              >
                {action.status === "running" ? (
                  <>
                    <Clock3 className="h-3 w-3 animate-pulse" />
                    Running
                  </>
                ) : action.status === "success" ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-[#35D6A1]" />
                    Completed
                  </>
                ) : (
                  <>
                    Execute
                    <ChevronRight className="h-3 w-3" />
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {actions.some((action) => action.status === "success") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-[#35D6A1]/10 bg-[#35D6A1]/[0.025] px-5 py-3 text-[10px] text-[#35D6A1]"
          >
            Response activity recorded in the case audit trail.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
