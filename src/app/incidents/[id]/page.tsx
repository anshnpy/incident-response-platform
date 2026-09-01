import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  Monitor,
  Network,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";
import { CreateCaseButton } from "@/components/ir/CreateCaseButton";
import { IncidentDetailClient } from "@/components/ir/IncidentDetailClient";

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
  Critical:
    "text-[#FF5364] border-[#FF5364]/20 bg-[#FF5364]/[0.05]",
  High:
    "text-[#FFB84D] border-[#FFB84D]/20 bg-[#FFB84D]/[0.05]",
  Medium:
    "text-[#4F8CFF] border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05]",
  Low:
    "text-[#35D6A1] border-[#35D6A1]/20 bg-[#35D6A1]/[0.05]",
};

async function getIncident(id: string): Promise<WazuhIncident | null> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as WazuhIncidentsResponse;

    return (
      data.incidents.find((incident) => incident.id === id) ?? null
    );
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const incident = await getIncident(id);

  if (!incident) {
    return (
      <NavigationRoute
        eyebrow="Detection"
        title="Incident Not Found"
        description="The requested Wazuh incident could not be found in the current telemetry."
      >
        <div className="rounded-xl border border-[#263441] bg-[#101720] p-5">
          <div className="text-[10px] font-medium text-[#A7AFBA]">
            No matching incident
          </div>

          <div className="mt-1 text-[9px] leading-5 text-[#59616D]">
            Incident ID: {id}
          </div>

          <Link
            href="/incidents"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#263441] px-3 py-2 text-[10px] text-[#A7AFBA] transition hover:border-[#4F8CFF]/30 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to incidents
          </Link>
        </div>
      </NavigationRoute>
    );
  }

  const severity =
    severityClass[incident.severity] ??
    "text-[#8B93A1] border-[#263441] bg-[#0B1016]";

  return (
    <NavigationRoute
      eyebrow="Detection"
      title={incident.title}
      description="Detailed view of the selected Wazuh incident and its correlated telemetry."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/incidents"
            className="inline-flex items-center gap-2 text-[10px] text-[#69727E] transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to incidents
          </Link>

          <span
            className={`rounded-md border px-2 py-1 text-[8px] font-semibold uppercase ${severity}`}
          >
            {incident.severity}
          </span>
        </div>

        <section className="rounded-xl border border-[#263441] bg-[#101720]">
          <div className="border-b border-[#263441] p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#FF5364]/20 bg-[#FF5364]/[0.05]">
                <ShieldAlert className="h-4 w-4 text-[#FF5364]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-mono text-[10px] text-[#69727E]">
                  {incident.id}
                </div>

                <h2 className="mt-1 text-[18px] font-semibold text-[#E7ECF2]">
                  {incident.title}
                </h2>

                <div className="mt-1.5 text-[10px] text-[#59616D]">
                  {incident.status}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Detail
              icon={Network}
              label="Source"
              value={incident.source}
            />

            <Detail
              icon={Monitor}
              label="Endpoint"
              value={incident.endpoint}
            />

            <Detail
              icon={ShieldCheck}
              label="Technique"
              value={incident.technique ?? "Not mapped"}
            />

            <Detail
              icon={ArrowUpRight}
              label="Occurrences"
              value={String(incident.occurrences)}
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              First Seen
            </div>

            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#D9DEE7]">
              <Clock3 className="h-3.5 w-3.5 text-[#59616D]" />
              {formatDate(incident.firstSeen)}
            </div>
          </div>

          <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Last Seen
            </div>

            <div className="mt-2 flex items-center gap-2 text-[11px] text-[#D9DEE7]">
              <Clock3 className="h-3.5 w-3.5 text-[#59616D]" />
              {formatDate(incident.lastSeen)}
            </div>
          </div>
        </section>

        <IncidentDetailClient
          incidentId={incident.id}
          fallbackStatus={incident.status}
        />

        <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
          <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
            Next Action
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/investigate?incident=${encodeURIComponent(incident.id)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F8CFF] px-3 py-2 text-[10px] font-medium text-white transition hover:bg-[#62AEFF]"
            >
              Investigate
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <CreateCaseButton incident={incident} />
          </div>
        </section>
      </div>
    </NavigationRoute>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Network;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#1B2430] bg-[#0B1016] p-3">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-[#4F8CFF]" />

        <span className="text-[9px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
          {label}
        </span>
      </div>

      <div className="mt-2 truncate font-mono text-[11px] text-[#D9DEE7]">
        {value}
      </div>
    </div>
  );
}
