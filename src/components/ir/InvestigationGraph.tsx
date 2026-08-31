"use client";

import { motion } from "motion/react";
import {
  ArrowRight,
  Globe2,
  Laptop2,
  Network,
  Terminal,
  UserRound,
} from "lucide-react";

type GraphNode = {
  id: string;
  label: string;
  type: "ip" | "account" | "endpoint" | "malware" | "c2";
};

interface InvestigationGraphEvent {
  id: string;
  title: string;
  timestamp?: string;
  entity: {
    name: string;
    type: string;
    technique?: string | null;
  };
}

interface InvestigationGraphProps {
  selectedNodeId?: string;
  highlightedTechnique?: string | null;
  events?: InvestigationGraphEvent[];
  onSelect?: (node: GraphNode) => void;
  onTraceSelect?: (title: string, eventId?: string) => void;
}

const nodeStyles = {
  ip: {
    icon: Globe2,
    title: "Attacker IP",
    accent: "#4DD7E8",
  },
  account: {
    icon: UserRound,
    title: "Compromised Account",
    accent: "#5B8CFF",
  },
  endpoint: {
    icon: Laptop2,
    title: "Endpoint",
    accent: "#5B8CFF",
  },
  malware: {
    icon: Terminal,
    title: "Malware",
    accent: "#FF4D67",
  },
  c2: {
    icon: Network,
    title: "C2",
    accent: "#F2B84B",
  },
};

export function InvestigationGraph({
  selectedNodeId,
  highlightedTechnique,
  events = [],
  onSelect,
  onTraceSelect,
}: InvestigationGraphProps) {
  const liveNodes: GraphNode[] = Array.from(
    new Map(
      events
        .filter(
          (event) =>
            event.entity.name &&
            event.entity.name !== "Unknown",
        )
        .map((event) => {
          const type = event.entity.type.toLowerCase();

          const nodeType: GraphNode["type"] =
            type.includes("process") || type.includes("malware")
              ? "malware"
              : type.includes("user") || type.includes("account")
                ? "account"
                : type.includes("network") || type.includes("ip")
                  ? "ip"
                  : "endpoint";

          return [
            `${nodeType}:${event.entity.name}`,
            {
              id: `${nodeType}:${event.entity.name}`,
              label: event.entity.name,
              type: nodeType,
            },
          ] as const;
        }),
    ).values(),
  ).slice(0, 5);

  const nodes: GraphNode[] =
    liveNodes.length > 0
      ? liveNodes
      : [
          {
            id: "endpoint:unknown",
            label: "No correlated entity",
            type: "endpoint",
          },
        ];

  const graphEvents = events
    .filter((event) => event.entity.name && event.entity.name !== "Unknown")
    .slice(0, 8);

  const livePathEvents =
    graphEvents.length > 0
      ? graphEvents.slice(0, 4).map((event, index) => [
          String(index + 1).padStart(2, "0"),
          event.timestamp
            ? new Date(event.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            : "--:--:--",
          event.title,
          event.entity.type,
          event.id,
        ] as const)
      : [];

  const techniqueNodeIds = new Set(
    graphEvents
      .filter((event) => event.entity.technique)
      .map((event) => event.entity.technique),
  );

  const selectedIndex = nodes.findIndex(
    (node) => node.id === selectedNodeId,
  );

  return (
    <section className="border-b border-[#263441]/70 bg-[#0B0F14]">
      <div className="flex items-center justify-between border-b border-[#263441]/70 px-5 py-3.5">
        <div>
          <div className="text-[14px] font-semibold text-[#E7ECF2]">
            Investigation Graph
          </div>

          <div className="mt-1 text-[10px] text-[#66717D]">
            Entity relationships reconstructed from investigation telemetry
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[9px] text-[#66717D]">
            {nodes.length} entities
          </span>

          <span className="font-mono text-[9px] text-[#66717D]">
            {Math.max(nodes.length - 1, 0)} links
          </span>
        </div>
      </div>

      <div className="overflow-x-auto px-5 py-6">
        <div className="mx-auto flex min-w-[860px] max-w-[1180px] items-center justify-center">
          {nodes.map((node, index) => {
            const style = nodeStyles[node.type];
            const Icon = style.icon;
            const selected = node.id === selectedNodeId;

            const techniqueFocused =
              Boolean(highlightedTechnique) &&
              techniqueNodeIds.has(highlightedTechnique) &&
              graphEvents.some(
                (event) =>
                  event.entity.technique === highlightedTechnique &&
                  event.entity.name === node.label,
              );

            const distance =
              selectedIndex === -1
                ? 0
                : Math.abs(index - selectedIndex);

            const connected =
              selectedIndex === -1 || distance <= 1;

            const mitreActive = Boolean(highlightedTechnique);

            const visibleNode =
              !mitreActive ||
              techniqueFocused ||
              connected;

            return (
              <div
                key={node.id}
                className="flex min-w-0 flex-1 items-center"
              >
                <motion.button
                  type="button"
                  onClick={() => onSelect?.(node)}
                  initial={{
                    opacity: 0,
                    y: 8,
                    scale: 0.98,
                  }}
                  animate={{
                    opacity: visibleNode ? 1 : 0.38,
                    y: 0,
                    scale: selected || techniqueFocused ? 1.025 : 1,
                  }}
                  transition={{
                    duration: 0.28,
                    delay: index * 0.07,
                    ease: "easeOut",
                  }}
                  className={`group relative min-w-0 flex-1 rounded-xl border px-3 py-3 text-left transition ${
                    selected
                      ? "border-[#4DD7E8]/40 bg-[#4DD7E8]/[0.06] shadow-[0_0_18px_rgba(77,215,232,0.08)]"
                      : techniqueFocused
                        ? "border-[#FF4D67]/45 bg-[#FF4D67]/[0.05] shadow-[0_0_22px_rgba(255,77,103,0.10)]"
                        : "border-[#202A36] bg-[#0E141B] hover:border-[#2C3948] hover:bg-[#111820]"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border"
                      style={{
                        borderColor: `${style.accent}35`,
                        backgroundColor: `${style.accent}0D`,
                      }}
                    >
                      <Icon
                        className="h-3.5 w-3.5"
                        style={{ color: style.accent }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div
                        className="truncate text-[9px] font-medium uppercase tracking-[0.08em]"
                        style={{
                          color: style.accent,
                          opacity: 0.9,
                        }}
                      >
                        {style.title}
                      </div>

                      <div className="mt-1 truncate text-[12px] font-medium text-[#E7ECF2]">
                        {node.label}
                      </div>
                    </div>
                  </div>

                  {selected && (
                    <motion.span
                      className="absolute -inset-px rounded-xl border border-[#4DD7E8]/25"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: 0.22,
                        ease: "easeOut",
                      }}
                    />
                  )}
                </motion.button>

                {index < nodes.length - 1 && (
                  <div className="relative w-8 shrink-0">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: connected ? 1 : 0.65 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.07 + 0.14,
                        ease: "easeOut",
                      }}
                      className={`h-px origin-left ${
                        connected
                          ? "bg-[#334255]"
                          : "bg-[#1B2430]"
                      }`}
                    />

                    <ArrowRight
                      className={`absolute right-0 top-1/2 h-3 w-3 -translate-y-1/2 translate-x-1/2 ${
                        connected
                          ? "text-[#4DD7E8]"
                          : "text-[#3A4652]"
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[#263441]/70 bg-[#080D12] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9AA6B2]">
              Attack Path
            </div>

            <div className="mt-1 text-[10px] text-[#66717D]">
              Chronological sequence associated with the observed path
            </div>
          </div>
        </div>

        <div className="relative mt-5">
          <div className="absolute left-[3%] right-[3%] top-[6px] h-px bg-[#253142]" />

          <div className="relative grid grid-cols-4 gap-5">
            {livePathEvents.map(([step, time, title, type, eventId], index) => (
              <motion.button
                key={eventId}
                type="button"
                onClick={() => onTraceSelect?.(title, eventId)}
                initial={{
                  opacity: 0,
                  y: 6,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.24,
                  delay: 0.15 + index * 0.08,
                  ease: "easeOut",
                }}
                className="group min-w-0 text-left"
              >
                <div className="relative z-10 flex h-3 items-center">
                  <span className="h-3 w-3 rounded-full border-2 border-[#080D12] bg-[#4DD7E8] transition group-hover:scale-110" />
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <span className="font-mono text-[9px] text-[#4DD7E8]">
                    {step}
                  </span>

                  <span className="font-mono text-[10px] text-[#66717D]">
                    {time}
                  </span>
                </div>

                <div className="mt-1.5 text-[12px] font-medium text-[#D7DDE5] group-hover:text-white">
                  {title}
                </div>

                <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-[#66717D]">
                  {type}
                </div>

                <div className="mt-2 h-px w-8 bg-[#253142] transition-all duration-200 group-hover:w-14 group-hover:bg-[#4DD7E8]/50" />
              </motion.button>
            ))}

            {livePathEvents.length === 0 && (
              <div className="col-span-4 rounded-lg border border-[#202A36] bg-[#0E141B] px-4 py-5 text-center text-[9px] text-[#59616D]">
                No correlated investigation path available.
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-[9px] text-[#66717D]">
          <span>Network</span>
          <span className="text-[#253142]">&middot;</span>
          <span>Identity</span>
          <span className="text-[#253142]">&middot;</span>
          <span>Endpoint</span>
          <span className="text-[#253142]">&middot;</span>
          <span>Execution</span>
          <span className="text-[#253142]">&middot;</span>
          <span>C2</span>
        </div>
      </div>
    </section>
  );
}
