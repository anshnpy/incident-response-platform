import Link from "next/link";
import { ArrowUpRight, FileSearch } from "lucide-react";

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

interface EvidenceRecord {
  id: string;
  name: string;
  type: string;
  source: string;
  collected: string;
  status: "Collected";
}

function extractEvidence(hits: WazuhHit[]): EvidenceRecord[] {
  const seen = new Set<string>();
  const records: EvidenceRecord[] = [];

  for (const hit of hits) {
    const source = hit._source;
    const eventdata = source?.data?.win?.eventdata ?? {};

    const timestamp = source?.["@timestamp"] ?? new Date().toISOString();
    const endpoint = source?.agent?.name ?? "Unknown";

    if (eventdata.image) {
      const id = `process:${eventdata.image}`;

      if (!seen.has(id)) {
        seen.add(id);

        records.push({
          id,
          name: eventdata.image.split("\\").pop() ?? eventdata.image,
          type: "Process Artifact",
          source: endpoint,
          collected: new Date(timestamp).toLocaleString("en-IN"),
          status: "Collected",
        });
      }
    }

    if (eventdata.commandLine) {
      const id = `command:${eventdata.commandLine}`;

      if (!seen.has(id)) {
        seen.add(id);

        records.push({
          id,
          name: eventdata.commandLine,
          type: "Command Line",
          source: endpoint,
          collected: new Date(timestamp).toLocaleString("en-IN"),
          status: "Collected",
        });
      }
    }
  }

  return records.slice(0, 100);
}

async function getEvidence(): Promise<EvidenceRecord[]> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WazuhAlertsResponse;

    return extractEvidence(data.hits?.hits ?? []);
  } catch {
    return [];
  }
}

export default async function Page() {
  const evidence = await getEvidence();

  return (
    <NavigationRoute
      eyebrow="Forensics"
      title="Evidence"
      description="Review live forensic artifacts reconstructed from Wazuh telemetry."
    >
      {evidence.length === 0 ? (
        <div className="rounded-xl border border-[#1B2430] bg-[#101720] px-4 py-10 text-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
            No evidence
          </div>

          <div className="mt-2 text-[11px] text-[#8B93A1]">
            No forensic artifacts are currently available from Wazuh.
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
          <div className="grid grid-cols-[minmax(0,1.7fr)_160px_minmax(0,1fr)_150px_90px] border-b border-[#263441] px-4 py-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
            <span>Artifact</span>
            <span>Type</span>
            <span>Source</span>
            <span>Collected</span>
            <span>Status</span>
          </div>

          <div className="divide-y divide-[#263441]">
            {evidence.map((item) => (
              <Link
                key={item.id}
                href={`/investigate?entity=${encodeURIComponent(item.name)}`}
                className="group grid grid-cols-[minmax(0,1.7fr)_160px_minmax(0,1fr)_150px_90px] items-center gap-2 px-4 py-3.5 transition hover:bg-white/[0.018]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#35D6FF]/15 bg-[#35D6FF]/[0.04]">
                    <FileSearch className="h-3.5 w-3.5 text-[#35D6FF]" />
                  </div>

                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] text-[#D9DEE7]">
                      {item.name}
                    </div>

                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[#59616D]">
                      <span>Forensic artifact</span>
                      <ArrowUpRight className="h-2.5 w-2.5" />
                    </div>
                  </div>
                </div>

                <span className="truncate text-[10px] text-[#8B93A1]">
                  {item.type}
                </span>

                <span className="truncate font-mono text-[10px] text-[#69727E]">
                  {item.source}
                </span>

                <span className="text-[10px] text-[#69727E]">
                  {item.collected}
                </span>

                <span className="text-[10px] font-medium uppercase text-[#35D6A1]">
                  {item.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </NavigationRoute>
  );
}
