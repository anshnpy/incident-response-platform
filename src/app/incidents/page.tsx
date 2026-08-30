import Link from "next/link";
import { ArrowUpRight, ShieldAlert } from "lucide-react";

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

const severityClass: Record<string, string> = {
  Critical:
    "text-[#FF5364] border-[#FF5364]/20 bg-[#FF5364]/[0.05]",
  High:
    "text-[#FFB84D] border-[#FFB84D]/20 bg-[#FFB84D]/[0.05]",
  Medium:
    "text-[#4F8CFF] border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05]",
  Low:
    "text-[#35D6A1] border-[#35D6A1]/20 bg-[#35D6A1]/[0.05]",
};

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/incidents";

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

export default async function Page() {
  const incidents = await getIncidents();

  return (
    <NavigationRoute
      eyebrow="Detection"
      title="Incidents"
      description="Live security incidents derived from Wazuh telemetry and correlated investigation activity."
    >
      <div className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
        <div className="grid items-center gap-2 border-b border-[#263441] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#59616D]"
          style={{
            gridTemplateColumns:
              "minmax(0,1.7fr) 105px 110px minmax(0,1fr) 90px",
          }}>
          <span>Incident</span>
          <span>Severity</span>
          <span>Status</span>
          <span>Endpoint</span>
          <span>Events</span>
        </div>

        {incidents.length > 0 ? (
          <div className="divide-y divide-[#263441]">
            {incidents.map((incident, index) => (
              <Link
                key={`${incident.id}-${incident.title}-${incident.firstSeen}-${index}`}
                href={`/incidents/${encodeURIComponent(incident.id)}`}
                className="group grid items-center gap-2 px-4 py-3 transition hover:bg-white/[0.018]"
                style={{
                  gridTemplateColumns:
                    "minmax(0,1.7fr) 105px 110px minmax(0,1fr) 90px",
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#59616D]" />

                    <span className="truncate font-mono text-[10px] text-[#69727E]">
                      {incident.id}
                    </span>
                  </div>

                  <div className="mt-1 truncate text-[11px] font-medium text-[#D9DEE7]">
                    {incident.title}
                  </div>

                  <div className="mt-0.5 truncate text-[9px] text-[#59616D]">
                    {incident.source}
                    {incident.technique
                      ? ` ? ${incident.technique}`
                      : ""}
                  </div>
                </div>

                <span
                  className={`w-fit rounded-md border px-2 py-1 text-[8px] font-semibold uppercase ${
                    severityClass[incident.severity] ??
                    "border-[#263441] bg-[#0B1016] text-[#8B93A1]"
                  }`}
                >
                  {incident.severity}
                </span>

                <span className="text-[9px] font-medium uppercase text-[#4F8CFF]">
                  {incident.status}
                </span>

                <span className="truncate font-mono text-[9px] text-[#8B93A1]">
                  {incident.endpoint}
                </span>

                <div className="flex items-center gap-1.5 text-[10px]">
                  <span className="font-mono font-semibold text-[#E7ECF2]">
                    {incident.occurrences}
                  </span>

                  <ArrowUpRight className="h-3 w-3 text-[#59616D] transition group-hover:text-[#4F8CFF]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <ShieldAlert className="mx-auto h-5 w-5 text-[#3A4652]" />

            <div className="mt-3 text-[11px] font-medium text-[#A7AFBA]">
              No incidents available
            </div>

            <div className="mt-1 text-[9px] text-[#59616D]">
              Wazuh incident telemetry is currently unavailable.
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 text-[9px] text-[#4F5660]">
        Showing live incidents from the connected SOC Lab Wazuh pipeline.
      </div>
    </NavigationRoute>
  );
}
