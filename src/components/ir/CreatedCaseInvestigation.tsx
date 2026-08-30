"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useState } from "react";

import { InvestigationShell } from "@/components/ir/InvestigationShell";
import { InvestigationWorkspace } from "@/components/ir/InvestigationWorkspace";

interface CreatedCase {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  status: string;
  phase: string;
  owner: string;
  affectedUser: string;
  affectedEndpoint: string;
  riskScore: number;
  startedAt: string;
  updatedAt: string;
  sourceIncidentId: string;
  sourceIp: string;
  technique: string | null;
  occurrences: number;
}

export function CreatedCaseInvestigation({
  caseId,
}: {
  caseId: string;
}) {
  const [caseData] = useState<CreatedCase | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem("ir-cases");

    if (!raw) {
      return null;
    }

    try {
      const cases = JSON.parse(raw) as CreatedCase[];
      return cases.find((item) => item.id === caseId) ?? null;
    } catch {
      return null;
    }
  });

  if (!caseData) {
    return (
      <InvestigationShell>
        <section className="rounded-2xl border border-[#263441] bg-[#0B1016] p-6">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
            Investigation
          </div>

          <h1 className="mt-2 text-[22px] font-semibold text-[#E7ECF2]">
            Case not found
          </h1>

          <p className="mt-1.5 text-[11px] text-[#7E8794]">
            No saved investigation case was found for {caseId}.
          </p>

          <Link
            href="/cases"
            className="mt-4 inline-flex items-center gap-2 text-[10px] text-[#4F8CFF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to cases
          </Link>
        </section>
      </InvestigationShell>
    );
  }

  const initialEventId =
    caseData.technique === "Process Injection"
      ? "evt-004"
      : caseData.technique === "Account Manipulation"
        ? "evt-007"
        : "evt-004";

  return (
    <InvestigationShell>
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
          <div className="border-b border-[#263441]/70 px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#8B93A1]">
                    {caseData.id}
                  </span>

                  <span className="rounded-md border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] px-2 py-1 text-[8px] font-semibold uppercase text-[#4F8CFF]">
                    Investigation
                  </span>
                </div>

                <h1 className="mt-2 text-[20px] font-semibold text-[#E7ECF2]">
                  {caseData.title}
                </h1>

                <p className="mt-1 text-[10px] text-[#69727E]">
                  Source incident:{" "}
                  <span className="font-mono text-[#A7AFBA]">
                    {caseData.sourceIncidentId}
                  </span>
                </p>
              </div>

              <Link
                href={`/incidents/${encodeURIComponent(caseData.sourceIncidentId)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#263441] px-3 py-2 text-[9px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
              >
                Source Incident
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Context label="Source IP" value={caseData.sourceIp} />
              <Context label="Endpoint" value={caseData.affectedEndpoint} />
              <Context
                label="Technique"
                value={caseData.technique ?? "Not mapped"}
              />
              <Context
                label="Occurrences"
                value={String(caseData.occurrences)}
              />
            </div>
          </div>
        </section>

        <InvestigationWorkspace
          initialEventId={initialEventId}
          caseContext={{
            caseId: caseData.id,
            sourceIp: caseData.sourceIp,
            endpoint: caseData.affectedEndpoint,
            technique: caseData.technique,
            title: caseData.title,
            firstSeen: caseData.startedAt,
            lastSeen: caseData.updatedAt,
          }}
        />
      </div>
    </InvestigationShell>
  );
}

function Context({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[#1B2430] bg-[#101720] px-3 py-2.5">
      <div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </div>

      <div className="mt-1 truncate font-mono text-[10px] text-[#D9DEE7]">
        {value}
      </div>
    </div>
  );
}
