import Link from "next/link";
import {
  ArrowUpRight,
  FileWarning,
  Globe2,
  Hash,
  ShieldAlert,
} from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/alerts";

interface WazuhHit {
  _id?: string;
  _source?: {
    agent?: {
      name?: string;
      ip?: string;
    };
    rule?: {
      level?: number;
    };
    data?: {
      win?: {
        eventdata?: Record<string, string>;
      };
    };
    ["@timestamp"]?: string;
  };
}

interface WazuhAlertsResponse {
  hits?: {
    hits?: WazuhHit[];
  };
}

interface IndicatorRecord {
  id: string;
  value: string;
  type: "IP" | "Hash";
  sightings: number;
  maxLevel: number;
  lastSeen: string;
}

function addIndicator(
  map: Map<string, IndicatorRecord>,
  value: string,
  type: IndicatorRecord["type"],
  hit: WazuhHit,
) {
  const source = hit._source;
  const level = source?.rule?.level ?? 0;
  const timestamp =
    source?.["@timestamp"] ?? new Date().toISOString();
  const id = `${type}:${value.toLowerCase()}`;

  const existing = map.get(id);

  if (existing) {
    existing.sightings += 1;
    existing.maxLevel = Math.max(existing.maxLevel, level);

    if (timestamp > existing.lastSeen) {
      existing.lastSeen = timestamp;
    }

    return;
  }

  map.set(id, {
    id,
    value,
    type,
    sightings: 1,
    maxLevel: level,
    lastSeen: timestamp,
  });
}

async function getIndicators(): Promise<IndicatorRecord[]> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WazuhAlertsResponse;
    const indicators = new Map<string, IndicatorRecord>();

    for (const hit of data.hits?.hits ?? []) {
      const source = hit._source;
      const eventdata = source?.data?.win?.eventdata ?? {};

      const agentIp = source?.agent?.ip;

      if (agentIp) {
        addIndicator(indicators, agentIp, "IP", hit);
      }

      const hash = eventdata.hashes?.match(
        /SHA256=([A-Fa-f0-9]{64})/i,
      )?.[1];

      if (hash) {
        addIndicator(indicators, hash, "Hash", hit);
      }
    }

    return [...indicators.values()].sort(
      (a, b) =>
        b.maxLevel - a.maxLevel ||
        b.sightings - a.sightings,
    );
  } catch {
    return [];
  }
}

function riskLabel(level: number) {
  if (level >= 12) return "Malicious";
  if (level >= 7) return "Suspicious";
  return "Observed";
}

function riskClass(level: number) {
  if (level >= 12) return "text-[#FF5364]";
  if (level >= 7) return "text-[#FFB84D]";
  return "text-[#35D6A1]";
}

function IndicatorIcon({ type }: { type: IndicatorRecord["type"] }) {
  return type === "IP" ? (
    <Globe2 className="h-3.5 w-3.5 text-[#35D6FF]" />
  ) : (
    <Hash className="h-3.5 w-3.5 text-[#7C6CFF]" />
  );
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ indicator?: string }>;
}) {
  const { indicator } = await searchParams;
  const selectedIndicator = indicator?.trim() || null;
  const indicators = await getIndicators();

  const selected = selectedIndicator
    ? indicators.find(
        (item) =>
          item.value.toLowerCase() ===
          selectedIndicator.toLowerCase(),
      )
    : null;

  return (
    <NavigationRoute
      eyebrow="Threat Intelligence"
      title="Threat Intel"
      description="Live indicators observed in Wazuh telemetry with local risk and sighting context."
    >
      {selectedIndicator && (
        <section className="rounded-xl border border-[#FF5364]/20 bg-[#FF5364]/[0.04] p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#FF5364]" />

            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#FF5364]">
                Selected indicator
              </div>

              <div className="mt-2 break-all font-mono text-[13px] font-semibold text-[#E7ECF2]">
                {selectedIndicator}
              </div>

              <div className="mt-1 text-[10px] text-[#69727E]">
                {selected
                  ? `${selected.type} ? ${selected.sightings} sightings ? ${riskLabel(selected.maxLevel)}`
                  : "Indicator not present in the current Wazuh result set."}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="mt-4 overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
        <div className="border-b border-[#263441] px-4 py-3.5">
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-[#FFB84D]" />

            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Observed Indicators
              </div>

              <div className="mt-1 text-[10px] text-[#69727E]">
                IP addresses and SHA-256 indicators reconstructed from live telemetry.
              </div>
            </div>

            <span className="ml-auto font-mono text-[9px] text-[#59616D]">
              {indicators.length} indicators
            </span>
          </div>
        </div>

        {indicators.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-[#69727E]">
            No indicators are currently available from Wazuh telemetry.
          </div>
        ) : (
          <div className="divide-y divide-[#263441]">
            {indicators.map((item) => (
              <Link
                key={item.id}
                href={`/threat-intel?indicator=${encodeURIComponent(item.value)}`}
                className={`grid grid-cols-[minmax(0,1.4fr)_100px_100px_110px] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.018] ${
                  selected?.id === item.id
                    ? "bg-[#FF5364]/[0.025]"
                    : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#263441] bg-[#0B1016]">
                    <IndicatorIcon type={item.type} />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-mono text-[10px] text-[#D9DEE7]">
                      {item.value}
                    </div>

                    <div className="mt-0.5 text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
                      {item.type}
                    </div>
                  </div>
                </div>

                <span className={`text-[9px] uppercase ${riskClass(item.maxLevel)}`}>
                  {riskLabel(item.maxLevel)}
                </span>

                <span className="font-mono text-[9px] text-[#A7AFBA]">
                  {item.sightings} sightings
                </span>

                <span className="flex items-center justify-end gap-1.5 text-[9px] text-[#59616D]">
                  Level {item.maxLevel}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="mt-3 text-[9px] text-[#4F5660]">
        Reputation shown here is derived from Wazuh rule severity and local sightings; no external reputation provider is configured.
      </div>
    </NavigationRoute>
  );
}
