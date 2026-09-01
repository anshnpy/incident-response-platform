import Link from "next/link";
import { getCloudflareContext } from "@opennextjs/cloudflare";

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

    const riskMatch =
      params?.risk !== "high" ||
      item.riskScore >= 80;

    return queryMatch && severityMatch && statusMatch && riskMatch;
  });

  return (
    <InvestigationShell>
      <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
        <div className="border-b border-[#263441] px-5 py-5 sm:px-6">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
            Investigation
          </div>

          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-[#E7ECF2]">
            Cases
          </h1>

          <p className="mt-1.5 text-[11px] leading-5 text-[#7E8794]">
            Active investigations and analyst-owned response cases.
          </p>
        </div>

        <CaseFilters
          statuses={[
            ...new Set(allCases.map((item) => item.status)),
          ]}
          severities={[
            ...new Set(allCases.map((item) => item.severity)),
          ]}
        />

        {cases.length === 0 ? (
          <div className="p-6">
            <div className="rounded-xl border border-[#1B2430] bg-[#101720] px-4 py-10 text-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                No cases
              </div>

              <div className="mt-2 text-[11px] text-[#8B93A1]">
                No investigation cases are currently stored in D1.
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[#263441]">
            {cases.map((item) => (
              <Link
                key={item.id}
                href={`/cases/${encodeURIComponent(item.id)}`}
                className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.018]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-[#8B93A1]">
                      {item.id}
                    </span>

                    <span className="rounded-md border border-[#263441] px-2 py-1 text-[9px] font-semibold uppercase text-[#A7AFBA]">
                      {item.severity}
                    </span>

                    <span className="rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] px-2 py-1 text-[9px] font-medium uppercase text-[#35D6A1]">
                      {item.status}
                    </span>
                  </div>

                  <div className="mt-2 text-[13px] font-semibold text-[#E7ECF2]">
                    {item.title}
                  </div>

                  <div className="mt-1 text-[10px] text-[#69727E]">
                    {item.affectedUser ?? "Unknown"} &middot;{" "}
                    {item.affectedEndpoint ?? "Unknown"} &middot; Risk{" "}
                    {item.riskScore}/100
                  </div>
                </div>

                <span className="shrink-0 text-[10px] text-[#4F8CFF] transition group-hover:text-[#62AEFF]">
                  Open case &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </InvestigationShell>
  );
}
