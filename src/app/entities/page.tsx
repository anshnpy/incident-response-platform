import Link from "next/link";
import {
  ArrowUpRight,
  FileCode2,
  Globe2,
  Laptop2,
  Terminal,
  UserRound,
} from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/alerts";

interface WazuhHit {
  _id?: string;
  _source?: {
    agent?: {
      ip?: string;
      name?: string;
    };
    rule?: {
      level?: number;
      mitre?: {
        id?: string[] | string;
        technique?: string[] | string;
      };
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

interface EntityRecord {
  id: string;
  name: string;
  type: "User" | "Endpoint" | "Process" | "IP Address" | "Hash";
  verdict: "Suspicious" | "Malicious";
  riskScore: number;
  details: Record<string, string>;
  technique?: string;
}

function firstValue(value?: string[] | string) {
  return Array.isArray(value) ? value[0] : value;
}

function riskFromLevel(level?: number) {
  return Math.min(99, Math.max(15, (level ?? 0) * 7));
}

function verdictFromLevel(level?: number): EntityRecord["verdict"] {
  return (level ?? 0) >= 12 ? "Malicious" : "Suspicious";
}

function addEntity(
  entities: Map<string, EntityRecord>,
  entity: EntityRecord,
) {
  const existing = entities.get(`${entity.type}:${entity.name}`);

  if (!existing || entity.riskScore > existing.riskScore) {
    entities.set(`${entity.type}:${entity.name}`, entity);
  }
}

async function getEntities(): Promise<EntityRecord[]> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WazuhAlertsResponse;
    const hits = data.hits?.hits ?? [];
    const entities = new Map<string, EntityRecord>();

    for (const hit of hits) {
      const source = hit._source;
      const eventdata = source?.data?.win?.eventdata ?? {};
      const level = source?.rule?.level;
      const riskScore = riskFromLevel(level);
      const verdict = verdictFromLevel(level);
      const technique = firstValue(
        source?.rule?.mitre?.id,
      );

      if (source?.agent?.name) {
        addEntity(entities, {
          id: `endpoint:${source.agent.name}`,
          name: source.agent.name,
          type: "Endpoint",
          verdict,
          riskScore,
          technique,
          details: {
            Agent: source.agent.name,
            IP: source.agent.ip ?? "Unknown",
          },
        });
      }

      if (source?.agent?.ip) {
        addEntity(entities, {
          id: `ip:${source.agent.ip}`,
          name: source.agent.ip,
          type: "IP Address",
          verdict,
          riskScore,
          technique,
          details: {
            IP: source.agent.ip,
            Endpoint: source.agent.name ?? "Unknown",
          },
        });
      }

      const user = eventdata.user ?? eventdata.targetUserName;

      if (user) {
        addEntity(entities, {
          id: `user:${user}`,
          name: user,
          type: "User",
          verdict,
          riskScore,
          technique,
          details: {
            User: user,
            Endpoint: source?.agent?.name ?? "Unknown",
          },
        });
      }

      if (eventdata.image) {
        addEntity(entities, {
          id: `process:${eventdata.image}`,
          name: eventdata.image.split("\\").pop() ?? eventdata.image,
          type: "Process",
          verdict,
          riskScore,
          technique,
          details: {
            Image: eventdata.image,
            CommandLine: eventdata.commandLine ?? "Unknown",
            User: eventdata.user ?? "Unknown",
            SHA256:
              eventdata.hashes?.replace(/^SHA256=/i, "") ??
              "Unknown",
          },
        });
      }

      const sha256 = eventdata.hashes?.match(
        /SHA256=([A-Fa-f0-9]{64})/i,
      )?.[1];

      if (sha256) {
        addEntity(entities, {
          id: `hash:${sha256.toLowerCase()}`,
          name: sha256,
          type: "Hash",
          verdict,
          riskScore,
          technique,
          details: {
            SHA256: sha256,
            Process: eventdata.image ?? "Unknown",
            Endpoint: source?.agent?.name ?? "Unknown",
          },
        });
      }
    }

    return [...entities.values()].sort(
      (a, b) => b.riskScore - a.riskScore,
    );
  } catch {
    return [];
  }
}

const iconMap = {
  User: UserRound,
  Endpoint: Laptop2,
  Process: Terminal,
  "IP Address": Globe2,
  Hash: FileCode2,
};

const verdictClass = {
  Suspicious: "text-[#FFB84D]",
  Malicious: "text-[#FF5364]",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const { search } = await searchParams;
  const entities = await getEntities();

  const query = search?.trim().toLowerCase() ?? "";

  const filteredEntities = query
    ? entities.filter((entity) => {
        const haystack = [
          entity.name,
          entity.type,
          entity.verdict,
          entity.technique ?? "",
          ...Object.values(entity.details),
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(query);
      })
    : entities;

  return (
    <NavigationRoute
      eyebrow="Entity Intelligence"
      title="Entities"
      description="Live users, endpoints, processes, addresses, and hashes reconstructed from Wazuh telemetry."
    >
      {filteredEntities.length === 0 ? (
        <div className="rounded-xl border border-[#1B2430] bg-[#101720] px-4 py-10 text-center">
          <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
            No entities
          </div>

          <div className="mt-2 text-[11px] text-[#8B93A1]">
            No entity telemetry is currently available from Wazuh.
          </div>
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[9px] uppercase tracking-[0.1em] text-[#59616D]">
              {filteredEntities.length} unique entities
            </div>

            <div className="font-mono text-[9px] text-[#59616D]">
              Live Wazuh telemetry
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEntities.map((entity) => {
              const Icon = iconMap[entity.type];

              const href =
                entity.type === "IP Address"
                  ? `/threat-intel?indicator=${encodeURIComponent(entity.name)}`
                  : `/investigate?entity=${encodeURIComponent(entity.name)}`;

              return (
                <Link
                  key={entity.id}
                  href={href}
                  className="group rounded-xl border border-[#263441] bg-[#101720] p-4 transition hover:border-[#4F8CFF]/30 hover:bg-[#131A22]"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4F8CFF]/15 bg-[#4F8CFF]/[0.04]">
                      <Icon className="h-3.5 w-3.5 text-[#4F8CFF]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11px] text-[#D9DEE7]">
                        {entity.name}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-[9px] uppercase tracking-[0.06em] text-[#59616D]">
                          {entity.type}
                        </span>

                        <span className={`text-[9px] uppercase ${verdictClass[entity.verdict]}`}>
                          {entity.verdict}
                        </span>
                      </div>
                    </div>

                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#59616D] transition group-hover:text-[#4F8CFF]" />
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#1B2430] pt-2.5">
                    <span className="text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
                      Risk
                    </span>

                    <span className="font-mono text-[9px] text-[#D9DEE7]">
                      {entity.riskScore}/100
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </NavigationRoute>
  );
}
