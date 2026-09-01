import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Search, ShieldAlert } from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

interface WazuhIncident {
  id: string;
  title: string;
  severity: string;
  source: string;
  endpoint: string;
  technique: string | null;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  status: string;
}

interface WazuhIncidentsResponse {
  incidents: WazuhIncident[];
}

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/incidents";

const severityClass: Record<string, string> = {
  Critical: "text-[#FF5364]",
  High: "text-[#FFB84D]",
  Medium: "text-[#4F8CFF]",
  Low: "text-[#35D6A1]",
};

async function getIncidents(): Promise<WazuhIncident[]> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as WazuhIncidentsResponse;

    return Array.isArray(data.incidents) ? data.incidents : [];
  } catch {
    return [];
  }
}

async function getEntityTelemetry(entity: string) {
  try {
    const response = await fetch(
      "/api/wazuh/alerts?size=20",
      { cache: "no-store" },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      hits?: { hits?: Array<{
        _id?: string;
        _source?: {
          agent?: { name?: string; ip?: string };
          data?: {
            win?: {
              eventdata?: Record<string, string>;
            };
          };
          rule?: {
            description?: string;
            level?: number;
          };
          ["@timestamp"]?: string;
        };
      }> };
    };

    const normalized = entity.toLowerCase();

    return (data.hits?.hits ?? []).filter((hit) => {
      const source = hit._source;
      const eventdata = source?.data?.win?.eventdata ?? {};

      const values = [
        source?.agent?.name,
        source?.agent?.ip,
        eventdata.image,
        eventdata.user,
        eventdata.targetUserName,
        eventdata.commandLine,
        eventdata.hashes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return values.includes(normalized);
    });
  } catch {
    return [];
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    incident?: string;
    entity?: string;
    event?: string;
  }>;
}) {
  const {
    incident: selectedIncidentId,
    entity: selectedEntityName,
    event: selectedEventId,
  } = await searchParams;
  const incidents = await getIncidents();

  const entityTelemetry = selectedEntityName
    ? await getEntityTelemetry(selectedEntityName)
    : [];

  const selectedIncident = selectedIncidentId
    ? incidents.find((item) => item.id === selectedIncidentId) ?? null
    : null;

  let selectedEvent: {
    id: string;
    title: string;
    endpoint: string;
    timestamp: string;
    level: number;
  } | null = null;

  if (selectedEventId) {
    try {
      const response = await fetch(
        "/api/wazuh/alerts?size=50",
        { cache: "no-store" },
      );

      if (response.ok) {
        const data = (await response.json()) as {
          hits?: {
            hits?: Array<{
              _id?: string;
              _source?: {
                id?: string;
                agent?: {
                  name?: string;
                };
                rule?: {
                  description?: string;
                  level?: number;
                };
                timestamp?: string;
                "@timestamp"?: string;
              };
            }>;
          };
        };

        const hit = (data.hits?.hits ?? []).find(
          (item) => (item._source?.id ?? item._id) === selectedEventId,
        );

        if (hit) {
          const source = hit._source;

          selectedEvent = {
            id: source?.id ?? hit._id ?? selectedEventId,
            title: source?.rule?.description ?? "Wazuh event",
            endpoint: source?.agent?.name ?? "Unknown endpoint",
            timestamp:
              source?.timestamp ??
              source?.["@timestamp"] ??
              "Unknown time",
            level: source?.rule?.level ?? 0,
          };
        }
      }
    } catch {
      selectedEvent = null;
    }
  }

  return (
    <NavigationRoute
      eyebrow="Analysis"
      title="Investigate"
      description="Investigate live Wazuh incidents through telemetry, evidence, entity relationships, and response context."
    >
      <div className="space-y-4">
        {selectedEvent ? (
          <section className="rounded-xl border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.035] p-5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Selected Wazuh Event
            </div>

            <div className="mt-2 font-medium text-[13px] text-[#D9DEE7]">
              {selectedEvent.title}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <InvestigationField
                label="Event ID"
                value={selectedEvent.id}
              />

              <InvestigationField
                label="Endpoint"
                value={selectedEvent.endpoint}
              />

              <InvestigationField
                label="Rule Level"
                value={String(selectedEvent.level)}
              />
            </div>

            <div className="mt-3 font-mono text-[9px] text-[#69727E]">
              {selectedEvent.timestamp}
            </div>
          </section>
        ) : selectedEntityName ? (
          <section className="rounded-xl border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.035] p-5">
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-4 w-4 shrink-0 text-[#4F8CFF]" />

              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                  Entity Investigation
                </div>

                <div className="mt-1 truncate font-mono text-[12px] text-[#D9DEE7]">
                  {selectedEntityName}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-[10px] text-[#7E8794]">
                Matching Wazuh telemetry for this entity.
              </p>

              <span className="font-mono text-[9px] text-[#4F8CFF]">
                {entityTelemetry.length} events
              </span>
            </div>

            {entityTelemetry.length > 0 ? (
              <div className="mt-4 divide-y divide-[#263441]/70 rounded-lg border border-[#263441] bg-[#0B1016]">
                {entityTelemetry.slice(0, 6).map((hit) => (
                  <div key={hit._id ?? hit._source?.["@timestamp"]} className="px-3 py-2.5">
                    <div className="text-[9px] font-medium text-[#D9DEE7]">
                      {hit._source?.rule?.description ?? "Wazuh alert"}
                    </div>

                    <div className="mt-1 font-mono text-[8px] text-[#59616D]">
                      {hit._source?.agent?.name ?? "Unknown endpoint"}
                      {" ? "}
                      level {hit._source?.rule?.level ?? 0}
                      {" ? "}
                      {hit._source?.["@timestamp"]
                        ? new Date(hit._source["@timestamp"]).toLocaleString("en-IN")
                        : "Unknown time"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-[#1B2430] bg-[#0B1016] px-3 py-4 text-[9px] text-[#69727E]">
                No matching Wazuh telemetry was found for this entity.
              </div>
            )}

            <Link
              href="/entities"
              className="mt-4 inline-flex items-center gap-1.5 text-[9px] text-[#4F8CFF] transition hover:text-[#62AEFF]"
            >
              Back to entities
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </section>
        ) : selectedIncident ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.035] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <ShieldAlert className="h-4 w-4 shrink-0 text-[#4F8CFF]" />

                <div className="min-w-0">
                  <div className="font-mono text-[9px] text-[#69727E]">
                    {selectedIncident.id}
                  </div>

                  <div className="mt-1 truncate text-[11px] font-medium text-[#D9DEE7]">
                    {selectedIncident.title}
                  </div>
                </div>
              </div>

              <Link
                href={`/incidents/${encodeURIComponent(selectedIncident.id)}`}
                className="inline-flex shrink-0 items-center gap-1.5 text-[9px] text-[#4F8CFF] transition hover:text-[#62AEFF]"
              >
                View incident
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                    Selected Incident
                  </div>

                  <h2 className="mt-1.5 text-[16px] font-semibold text-[#E7ECF2]">
                    {selectedIncident.title}
                  </h2>
                </div>

                <span
                  className={`rounded-md border border-current/20 bg-current/[0.04] px-2 py-1 text-[8px] font-semibold uppercase ${
                    severityClass[selectedIncident.severity] ??
                    "text-[#8B93A1]"
                  }`}
                >
                  {selectedIncident.severity}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InvestigationField
                  label="Source"
                  value={selectedIncident.source}
                />

                <InvestigationField
                  label="Endpoint"
                  value={selectedIncident.endpoint}
                />

                <InvestigationField
                  label="Technique"
                  value={selectedIncident.technique ?? "Not mapped"}
                />

                <InvestigationField
                  label="Occurrences"
                  value={String(selectedIncident.occurrences)}
                />
              </div>
            </section>

            <section className="rounded-xl border border-[#263441] bg-[#101720] p-5">
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Investigation Workspace
              </div>

              <div className="mt-2 text-[14px] font-medium text-[#D9DEE7]">
                Live incident context loaded
              </div>

              <p className="mt-1.5 max-w-2xl text-[10px] leading-5 text-[#69727E]">
                The selected Wazuh incident is now attached to the investigation
                flow. Evidence, entity relationships, findings, and response
                actions can be linked from this context.
              </p>
            </section>

            <Link
              href="/investigate"
              className="inline-flex items-center gap-2 text-[9px] text-[#69727E] transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to investigations
            </Link>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-[#263441] bg-[#101720] px-4 py-3">
              <Search className="h-4 w-4 shrink-0 text-[#59616D]" />

              <span className="text-[10px] text-[#59616D]">
                Select a live Wazuh incident to begin investigation.
              </span>
            </div>

            <div className="divide-y divide-[#263441] overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
              {incidents.map((item, index) => (
                <Link
                  key={`${item.id}-${item.title}-${item.firstSeen}-${index}`}
                  href={`/investigate?incident=${encodeURIComponent(item.id)}`}
                  className="group flex items-center gap-4 px-4 py-4 transition hover:bg-white/[0.018]"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#FF5364]/15 bg-[#FF5364]/[0.04]">
                    <ShieldAlert className="h-3.5 w-3.5 text-[#FF5364]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-[9px] text-[#69727E]">
                      {item.id}
                    </div>

                    <div className="mt-1 truncate text-[11px] font-medium text-[#D9DEE7]">
                      {item.title}
                    </div>

                    <div className="mt-1 truncate text-[9px] text-[#59616D]">
                      {item.endpoint} ? {item.source}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 text-[9px] font-semibold uppercase ${
                      severityClass[item.severity] ?? "text-[#8B93A1]"
                    }`}
                  >
                    {item.severity}
                  </span>

                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#59616D] transition group-hover:text-[#4F8CFF]" />
                </Link>
              ))}

              {incidents.length === 0 && (
                <div className="px-4 py-12 text-center text-[10px] text-[#59616D]">
                  No live Wazuh incidents available.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </NavigationRoute>
  );
}

function InvestigationField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#1B2430] bg-[#0B1016] p-3">
      <div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </div>

      <div className="mt-1.5 truncate font-mono text-[10px] text-[#D9DEE7]">
        {value}
      </div>
    </div>
  );
}
