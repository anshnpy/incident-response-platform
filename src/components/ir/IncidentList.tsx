"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";

import { IncidentFilters } from "@/components/ir/IncidentFilters";

interface Incident {
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
  priority?: string;
}

const severityRank: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

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

export function IncidentList({
  incidents,
  initialSeverity = "all",
  initialStatus = "all",
  initialPriority = "all",
  initialSource = "all",
}: {
  incidents: Incident[];
  initialSeverity?: string;
  initialStatus?: string;
  initialPriority?: string;
  initialSource?: string;
}) {
  const [severity, setSeverity] = useState(initialSeverity);
  const [priority, setPriority] = useState(initialPriority);
  const [status, setStatus] = useState(initialStatus);
  const [source, setSource] = useState(initialSource);
  const [sort, setSort] = useState("newest");

  const options = useMemo(() => {
    const unique = (values: string[]) =>
      [...new Set(values.filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      );

    return {
      severity: unique(incidents.map((item) => item.severity)),
      priority: unique(
        incidents.map((item) => item.priority ?? ""),
      ),
      status: unique(incidents.map((item) => item.status)),
      source: unique(incidents.map((item) => item.source)),
    };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    const result = incidents.filter((incident) => {
      if (
        severity !== "all" &&
        incident.severity.toLowerCase() !== severity
      ) {
        return false;
      }

      if (
        priority !== "all" &&
        (incident.priority ?? "").toLowerCase() !== priority
      ) {
        return false;
      }

      if (
        status !== "all" &&
        incident.status.toLowerCase() !== status
      ) {
        return false;
      }

      if (
        source !== "all" &&
        incident.source.toLowerCase() !== source
      ) {
        return false;
      }

      return true;
    });

    return [...result].sort((a, b) => {
      if (sort === "oldest") {
        return (
          new Date(a.firstSeen).getTime() -
          new Date(b.firstSeen).getTime()
        );
      }

      if (sort === "events-desc") {
        return b.occurrences - a.occurrences;
      }

      if (sort === "events-asc") {
        return a.occurrences - b.occurrences;
      }

      if (sort === "severity-desc") {
        return (
          (severityRank[b.severity] ?? 0) -
          (severityRank[a.severity] ?? 0)
        );
      }

      return (
        new Date(b.lastSeen).getTime() -
        new Date(a.lastSeen).getTime()
      );
    });
  }, [incidents, severity, priority, status, source, sort]);

  const reset = () => {
    setSeverity("all");
    setPriority("all");
    setStatus("all");
    setSource("all");
    setSort("newest");
  };

  return (
    <div className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
      <IncidentFilters
        severity={severity}
        priority={priority}
        status={status}
        source={source}
        sort={sort}
        severityOptions={[
          { value: "all", label: "All severities" },
          ...options.severity.map((value) => ({
            value: value.toLowerCase(),
            label: value,
          })),
        ]}
        priorityOptions={[
          { value: "all", label: "All priorities" },
          ...options.priority.map((value) => ({
            value: value.toLowerCase(),
            label: value,
          })),
        ]}
        statusOptions={[
          { value: "all", label: "All statuses" },
          ...options.status.map((value) => ({
            value: value.toLowerCase(),
            label: value,
          })),
        ]}
        sourceOptions={[
          { value: "all", label: "All sources" },
          ...options.source.map((value) => ({
            value,
            label: value,
          })),
        ]}
        onSeverityChange={setSeverity}
        onPriorityChange={setPriority}
        onStatusChange={setStatus}
        onSourceChange={setSource}
        onSortChange={setSort}
        onReset={reset}
      />

      <div className="grid items-center gap-2 border-b border-[#263441] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#59616D]"
        style={{
          gridTemplateColumns:
            "minmax(0,2fr) 100px 100px 120px minmax(0,1.15fr) 80px",
        }}
      >
        <span>Incident</span>
        <span>Severity</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Endpoint</span>
        <span>Events</span>
      </div>

      {filteredIncidents.length > 0 ? (
        <div className="divide-y divide-[#263441]">
          {filteredIncidents.map((incident, index) => (
            <Link
              key={`${incident.id}-${incident.title}-${incident.firstSeen}-${index}`}
              href={`/incidents/${encodeURIComponent(incident.id)}`}
              className="group grid items-center gap-2 px-4 py-3.5 transition hover:bg-white/[0.018]"
              style={{
                gridTemplateColumns:
                  "minmax(0,1.6fr) 95px 95px 110px minmax(0,1fr) 90px",
              }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-[#59616D]" />

                  <span className="truncate font-mono text-[11px] text-[#69727E]">
                    {incident.id}
                  </span>
                </div>

                <div className="mt-1 truncate text-[13px] font-medium text-[#D9DEE7]">
                  {incident.title}
                </div>

                <div className="mt-0.5 truncate text-[10px] text-[#59616D]">
                  {incident.source}
                  {incident.technique
                    ? ` - ${incident.technique}`
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

              <span className="text-[9px] font-medium uppercase text-[#A7AFBA]">
                {incident.priority}
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
            No matching incidents
          </div>

          <div className="mt-1 text-[10px] text-[#59616D]">
            Adjust the active filters to broaden the incident set.
          </div>
        </div>
      )}

      <div className="border-t border-[#263441]/70 px-4 py-2.5 text-[9px] text-[#4F5660]">
        Showing {filteredIncidents.length} of {incidents.length} live incidents.
      </div>
    </div>
  );
}
