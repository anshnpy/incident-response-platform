import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  AlertTriangle,
  ArrowUpRight,
  Laptop,
  ShieldAlert,
  User,
} from "lucide-react";

import { CaseFilters } from "@/components/ir/CaseFilters";
import { InvestigationShell } from "@/components/ir/InvestigationShell";

export const dynamic = "force-dynamic";

interface CaseRow {
  id: string;
  title: string;
  severity: string;
  status: string;
  affectedUser: string | null;
  affectedEndpoint: string | null;
  riskScore: number;
}

function severityTone(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return {
        rail: "bg-[#FF5364]",
        badge: "border-[#FF5364]/25 bg-[#FF5364]/[0.08] text-[#FF6B7A]",
        icon: "border-[#FF5364]/20 bg-[#FF5364]/[0.07] text-[#FF5364]",
      };
    case "high":
      return {
        rail: "bg-[#FF9F43]",
        badge: "border-[#FF9F43]/25 bg-[#FF9F43]/[0.08] text-[#FFB15F]",
        icon: "border-[#FF9F43]/20 bg-[#FF9F43]/[0.07] text-[#FF9F43]",
      };
    case "medium":
      return {
        rail: "bg-[#F4C95D]",
        badge: "border-[#F4C95D]/25 bg-[#F4C95D]/[0.08] text-[#F4C95D]",
        icon: "border-[#F4C95D]/20 bg-[#F4C95D]/[0.07] text-[#F4C95D]",
      };
    default:
      return {
        rail: "bg-[#4F8CFF]",
        badge: "border-[#4F8CFF]/25 bg-[#4F8CFF]/[0.08] text-[#62AEFF]",
        icon: "border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.07] text-[#62AEFF]",
      };
  }
}

function riskTone(score: number) {
  if (score >= 80) return "text-[#FF6B7A]";
  if (score >= 60) return "text-[#FFB15F]";
  return "text-[#35D6A1]";
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams?: Promise<{
    q?: string;
    severity?: string;
    status?: string;
    risk?: string;
  }>;
}) {
  const { env } = await getCloudflareContext({ async: true });
  const params = await searchParams;

  const result = await env.DB
    .prepare(
      `SELECT
        id,
        title,
        severity,
        status,
        affected_user AS affectedUser,
        affected_endpoint AS affectedEndpoint,
        risk_score AS riskScore
      FROM cases
      ORDER BY updated_at DESC`,
    )
    .all<CaseRow>();

  const allCases = result.results ?? [];

  const query = params?.q?.trim().toLowerCase() ?? "";
  const requestedSeverity = params?.severity?.toLowerCase() ?? "";

  const cases = allCases.filter((item) => {
    const haystack = [
      item.id,
      item.title,
      item.affectedUser ?? "",
      item.affectedEndpoint ?? "",
    ]
      .join(" ")
      .toLowerCase();

    const queryMatch = !query || haystack.includes(query);

    const severityMatch =
      !requestedSeverity ||
      requestedSeverity === "all" ||
      item.severity.toLowerCase() === requestedSeverity;

    const statusMatch =
      !params?.status ||
      (params.status === "active"
        ? !["closed", "resolved"].includes(item.status.toLowerCase())
        : item.status.toLowerCase() === params.status?.toLowerCase());

    const riskMatch = params?.risk !== "high" || item.riskScore >= 80;

    return queryMatch && severityMatch && statusMatch && riskMatch;
  });

  const activeCount = allCases.filter(
    (item) => !["closed", "resolved"].includes(item.status.toLowerCase()),
  ).length;

  const highRiskCount = allCases.filter((item) => item.riskScore >= 80).length;

  const closedCount = allCases.filter((item) =>
    ["closed", "resolved"].includes(item.status.toLowerCase()),
  ).length;

  return (
    <InvestigationShell>
      <section className="space-y-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#4F8CFF]">
              Investigation
            </div>

            <h1 className="mt-1.5 text-[25px] font-semibold tracking-tight text-[#EEF2F7]">
              Cases
            </h1>

            <p className="mt-1 text-[11px] leading-5 text-[#6F7A87]">
              Active investigations and analyst-owned response cases.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Metric label="Total" value={allCases.length} />
            <Metric label="Active" value={activeCount} />
            <Metric label="High risk" value={highRiskCount} danger />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016] shadow-[0_16px_48px_rgba(0,0,0,0.18)]">
          <CaseFilters
            statuses={[...new Set(allCases.map((item) => item.status))]}
            severities={[...new Set(allCases.map((item) => item.severity))]}
          />

          <div className="border-b border-[#1B2530] px-4 py-3 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#596674]">
                  Investigation queue
                </div>
                <div className="mt-1 text-[10px] text-[#7E8794]">
                  {cases.length} visible of {allCases.length} stored cases
                </div>
              </div>

              <div className="flex items-center gap-3 text-[9px] text-[#596674]">
                <span>{closedCount} closed</span>
                <span className="h-1 w-1 rounded-full bg-[#394653]" />
                <span>{highRiskCount} high risk</span>
              </div>
            </div>
          </div>

          {cases.length === 0 ? (
            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-dashed border-[#263441] bg-[#0D141B] px-4 py-12 text-center">
                <ShieldAlert className="mx-auto h-5 w-5 text-[#59616D]" />

                <div className="mt-3 text-[10px] font-medium uppercase tracking-[0.1em] text-[#69727E]">
                  No matching cases
                </div>

                <div className="mt-1.5 text-[11px] text-[#596674]">
                  Adjust the filters or search query to see more investigations.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 p-3 sm:p-4">
              {cases.map((item) => {
                const tone = severityTone(item.severity);

                return (
                  <Link
                    key={item.id}
                    href={`/cases/${encodeURIComponent(item.id)}`}
                    className="group relative block overflow-hidden rounded-xl border border-[#202C38] bg-[#0D141B] transition duration-200 hover:border-[#344454] hover:bg-[#101923]"
                  >
                    <div
                      className={`absolute inset-y-0 left-0 w-0.5 ${tone.rail}`}
                    />

                    <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[9px] text-[#596674]">
                            {item.id}
                          </span>

                          <span
                            className={`rounded-md border px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${tone.badge}`}
                          >
                            {item.severity}
                          </span>

                          <span className="rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] text-[#35D6A1]">
                            {item.status}
                          </span>

                          {item.riskScore >= 80 && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#FF5364]/15 bg-[#FF5364]/[0.04] px-2 py-1 text-[8px] font-medium uppercase tracking-[0.08em] text-[#FF6B7A]">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              High risk
                            </span>
                          )}
                        </div>

                        <div className="mt-2.5 truncate text-[14px] font-semibold text-[#E7ECF2]">
                          {item.title}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] text-[#69727E]">
                          <span className="inline-flex items-center gap-1">
                            <User className="h-3 w-3 text-[#596674]" />
                            {item.affectedUser ?? "Unknown"}
                          </span>

                          <span className="hidden h-1 w-1 rounded-full bg-[#35414C] sm:block" />

                          <span className="inline-flex items-center gap-1">
                            <Laptop className="h-3 w-3 text-[#596674]" />
                            {item.affectedEndpoint ?? "Unknown"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-[#1B2530] pt-3 lg:grid-cols-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                        <div>
                          <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-[#596674]">
                            Risk score
                          </div>
                          <div className={`mt-1 text-[15px] font-semibold ${riskTone(item.riskScore)}`}>
                            {item.riskScore}
                            <span className="ml-1 text-[9px] font-normal text-[#596674]">
                              /100
                            </span>
                          </div>
                        </div>

                        <div>
                          <div className="text-[8px] font-medium uppercase tracking-[0.1em] text-[#596674]">
                            Response state
                          </div>
                          <div className="mt-1 text-[10px] font-medium capitalize text-[#A7AFBA]">
                            {item.status}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-start lg:justify-end">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#263F63] bg-[#0E1723] px-3 py-2 text-[9px] font-medium text-[#62AEFF] transition group-hover:border-[#4F8CFF]/60 group-hover:bg-[#122033]">
                          Open case
                          <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </InvestigationShell>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number;
  danger?: boolean;
}) {
  return (
    <div className="min-w-[76px] rounded-lg border border-[#202C38] bg-[#0D141B] px-3 py-2">
      <div className="text-[8px] font-medium uppercase tracking-[0.09em] text-[#596674]">
        {label}
      </div>
      <div
        className={`mt-0.5 text-[15px] font-semibold ${
          danger ? "text-[#FF6B7A]" : "text-[#E7ECF2]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
