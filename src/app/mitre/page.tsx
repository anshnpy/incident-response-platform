import Link from "next/link";
import { ArrowUpRight, Shield } from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/alerts";

interface WazuhHit {
  _id?: string;
  _source?: {
    rule?: {
      level?: number;
      mitre?: {
        id?: string[] | string;
        technique?: string[] | string;
        tactic?: string[] | string;
      };
    };
  };
}

interface WazuhAlertsResponse {
  hits?: {
    hits?: WazuhHit[];
  };
}

interface TechniqueRecord {
  id: string;
  name: string;
  tactic: string;
  count: number;
  maxLevel: number;
}

function toArray(value?: string[] | string) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

async function getTechniques(): Promise<TechniqueRecord[]> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WazuhAlertsResponse;
    const techniques = new Map<string, TechniqueRecord>();

    for (const hit of data.hits?.hits ?? []) {
      const mitre = hit._source?.rule?.mitre;
      const ids = toArray(mitre?.id);
      const names = toArray(mitre?.technique);
      const tactics = toArray(mitre?.tactic);
      const level = hit._source?.rule?.level ?? 0;

      ids.forEach((id, index) => {
        const normalizedId = id.trim();

        if (!normalizedId) {
          return;
        }

        const existing = techniques.get(normalizedId);

        if (existing) {
          existing.count += 1;
          existing.maxLevel = Math.max(existing.maxLevel, level);
          return;
        }

        techniques.set(normalizedId, {
          id: normalizedId,
          name: names[index] ?? names[0] ?? "Unknown technique",
          tactic: tactics[index] ?? tactics[0] ?? "Technique",
          count: 1,
          maxLevel: level,
        });
      });
    }

    return [...techniques.values()].sort(
      (a, b) => b.count - a.count || b.maxLevel - a.maxLevel,
    );
  } catch {
    return [];
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ technique?: string }>;
}) {
  const { technique } = await searchParams;
  const selectedTechnique = technique?.trim() || null;
  const techniques = await getTechniques();

  const selected = selectedTechnique
    ? techniques.find(
        (item) => item.id.toLowerCase() === selectedTechnique.toLowerCase(),
      )
    : null;

  return (
    <NavigationRoute
      eyebrow="Detection Mapping"
      title="MITRE ATT&CK"
      description="Live ATT&CK techniques observed across the connected Wazuh telemetry."
    >
      {selectedTechnique ? (
        <section className="rounded-xl border border-[#7C6CFF]/25 bg-[#7C6CFF]/[0.045] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8B82FF]">
                Selected technique
              </div>

              <div className="mt-2 font-mono text-[16px] font-semibold text-[#E7ECF2]">
                {selectedTechnique}
              </div>

              <div className="mt-1 text-[10px] text-[#69727E]">
                {selected?.name ?? "Technique not present in current Wazuh results"}
              </div>
            </div>

            <Shield className="h-5 w-5 text-[#7C6CFF]" />
          </div>

          {selected && (
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              <Metric label="Tactic" value={selected.tactic} />
              <Metric label="Observed" value={String(selected.count)} />
              <Metric label="Max Rule Level" value={String(selected.maxLevel)} />
            </div>
          )}
        </section>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
        <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_110px_110px] border-b border-[#263441] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
          <span>Technique</span>
          <span>Tactic</span>
          <span>Observed</span>
          <span>Level</span>
        </div>

        {techniques.length === 0 ? (
          <div className="px-4 py-8 text-center text-[10px] text-[#69727E]">
            No MITRE mappings are currently available from Wazuh.
          </div>
        ) : (
          <div className="divide-y divide-[#263441]">
            {techniques.map((item) => (
              <Link
                key={item.id}
                href={`/mitre?technique=${encodeURIComponent(item.id)}`}
                className={`grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_110px_110px] items-center gap-2 px-4 py-3.5 transition hover:bg-white/[0.018] ${
                  selected?.id === item.id
                    ? "bg-[#7C6CFF]/[0.035]"
                    : ""
                }`}
              >
                <div className="min-w-0">
                  <div className="font-mono text-[11px] font-semibold text-[#8B82FF]">
                    {item.id}
                  </div>

                  <div className="mt-0.5 truncate text-[10px] text-[#D9DEE7]">
                    {item.name}
                  </div>
                </div>

                <span className="truncate text-[10px] text-[#8B93A1]">
                  {item.tactic}
                </span>

                <span className="font-mono text-[10px] text-[#C7CDD6]">
                  {item.count}
                </span>

                <span className="flex items-center gap-1.5 text-[10px] text-[#69727E]">
                  {item.maxLevel}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </NavigationRoute>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#263441] bg-[#101720] px-3 py-2.5">
      <div className="text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </div>

      <div className="mt-1 text-[11px] font-medium text-[#D9DEE7]">
        {value}
      </div>
    </div>
  );
}
