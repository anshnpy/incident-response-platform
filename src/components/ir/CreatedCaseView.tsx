"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";

import { InvestigationShell } from "@/components/ir/InvestigationShell";

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

const severityClass = {
  critical: "text-[#FF5364] border-[#FF5364]/20 bg-[#FF5364]/[0.05]",
  high: "text-[#FFB84D] border-[#FFB84D]/20 bg-[#FFB84D]/[0.05]",
  medium: "text-[#4F8CFF] border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05]",
  low: "text-[#35D6A1] border-[#35D6A1]/20 bg-[#35D6A1]/[0.05]",
};

export function CreatedCaseView({ caseId }: { caseId: string }) {
  const [caseData, setCaseData] = useState<CreatedCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCase() {
      try {
        const response = await fetch(
          `/api/cases/${encodeURIComponent(caseId)}`,
          {
            cache: "no-store",
          },
        );

        const data = (await response.json()) as {
          case?: CreatedCase;
          error?: string;
        };

        if (!response.ok || !data.case) {
          throw new Error(data.error ?? "Case not found.");
        }

        if (!cancelled) {
          setCaseData(data.case);
          setLoadError(null);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load case.",
          );
          setLoading(false);
        }
      }
    }

    void loadCase();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (loading) {
    return (
      <InvestigationShell>
        <div className="rounded-2xl border border-[#263441] bg-[#0B1016] p-6">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
            Case
          </div>

          <h1 className="mt-2 text-[22px] font-semibold text-[#E7ECF2]">
            Loading case...
          </h1>

          <p className="mt-1.5 text-[11px] text-[#7E8794]">
            Loading persistent case data from the investigation database.
          </p>
        </div>
      </InvestigationShell>
    );
  }

  if (!caseData) {
    return (
      <InvestigationShell>
        <div className="rounded-2xl border border-[#263441] bg-[#0B1016] p-6">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
            Case
          </div>

          <h1 className="mt-2 text-[22px] font-semibold text-[#E7ECF2]">
            Case not found
          </h1>

          <p className="mt-1.5 text-[11px] text-[#7E8794]">
            {loadError ?? `No case exists with ID ${caseId}.`}
          </p>

          <Link
            href="/incidents"
            className="mt-4 inline-flex items-center gap-2 text-[10px] text-[#4F8CFF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to incidents
          </Link>
        </div>
      </InvestigationShell>
    );
  }

  return (
    <InvestigationShell>
      <div className="space-y-5">
        <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
          <div className="border-b border-[#263441]/70 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-[#8B93A1]">
                {caseData.id}
              </span>

              <span
                className={`rounded-md border px-2 py-1 text-[9px] font-semibold uppercase ${severityClass[caseData.severity]}`}
              >
                {caseData.severity}
              </span>

              <span className="rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] px-2 py-1 text-[9px] font-medium uppercase text-[#35D6A1]">
                Investigating
              </span>
            </div>

            <h1 className="mt-3 text-[24px] font-semibold text-[#E7ECF2]">
              {caseData.title}
            </h1>

            <p className="mt-1.5 text-[11px] text-[#7E8794]">
              Analyst case created from live Wazuh incident{" "}
              <span className="font-mono text-[#A7AFBA]">
                {caseData.sourceIncidentId}
              </span>
            </p>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
            <Info label="Source IP" value={caseData.sourceIp} />
            <Info label="Endpoint" value={caseData.affectedEndpoint} />
            <Info
              label="Technique"
              value={caseData.technique ?? "Not mapped"}
            />
            <Info
              label="Occurrences"
              value={String(caseData.occurrences)}
            />
          </div>
        </section>

        <section className="rounded-xl border border-[#263441] bg-[#101720] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Investigation
              </div>

              <div className="mt-1.5 text-[14px] font-medium text-[#D9DEE7]">
                Case ready for investigation
              </div>

              <p className="mt-1 text-[10px] leading-5 text-[#69727E]">
                The Wazuh incident has been converted into an analyst-owned
                investigation case.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/incidents/${encodeURIComponent(caseData.sourceIncidentId)}`}
                className="inline-flex items-center gap-2 rounded-lg border border-[#263441] px-3 py-2 text-[10px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
              >
                Source Incident
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>

              <Link
                href={`/cases/${encodeURIComponent(caseData.id)}`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#4F8CFF] px-3 py-2 text-[10px] font-medium text-white transition hover:bg-[#62AEFF]"
              >
                Open Investigation
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </InvestigationShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#1B2430] bg-[#101720] p-3">
      <div className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </div>

      <div className="mt-1.5 truncate font-mono text-[10px] text-[#D9DEE7]">
        {value}
      </div>
    </div>
  );
}
