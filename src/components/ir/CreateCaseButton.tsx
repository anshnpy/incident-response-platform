"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export interface CaseCreationIncident {
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

export function CreateCaseButton({
  incident,
}: {
  incident: CaseCreationIncident;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  function createCase() {
    setCreating(true);

    try {
      const rawCases = window.localStorage.getItem("ir-cases");
      const existingCases = rawCases
        ? (JSON.parse(rawCases) as Array<{ id?: string }>)
        : [];

      const existingIds = existingCases
        .map((item) => item.id ?? "")
        .map((id) => Number(id.replace("IR-", "")))
        .filter((value) => Number.isFinite(value));

      const nextNumber =
        Math.max(2048, ...existingIds) + 1;

      const caseId = `IR-${nextNumber}`;

      const severity =
        incident.severity.toLowerCase() === "critical"
          ? "critical"
          : incident.severity.toLowerCase() === "high"
            ? "high"
            : incident.severity.toLowerCase() === "medium"
              ? "medium"
              : "low";

      const riskScore =
        severity === "critical"
          ? 93
          : severity === "high"
            ? 78
            : severity === "medium"
              ? 60
              : 35;

      const createdCase = {
        id: caseId,
        title: incident.title,
        severity,
        status: "investigating",
        phase: incident.technique ?? "Detection",
        owner: "Anshuman Pandey",
        affectedUser: "Unknown",
        affectedEndpoint: incident.endpoint,
        riskScore,
        startedAt: incident.firstSeen,
        updatedAt: incident.lastSeen,
        sourceIncidentId: incident.id,
        sourceIp: incident.source,
        technique: incident.technique,
        occurrences: incident.occurrences,
      };

      window.localStorage.setItem(
        "ir-cases",
        JSON.stringify([...existingCases, createdCase]),
      );

      setCreated(true);

      window.setTimeout(() => {
        router.push(`/cases/${caseId}`);
      }, 250);
    } catch {
      setCreating(false);
      setCreated(false);
    }
  }

  return (
    <button
      type="button"
      onClick={createCase}
      disabled={creating || created}
      className="inline-flex items-center gap-2 rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2 text-[10px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white disabled:cursor-wait disabled:opacity-70"
    >
      {created ? (
        <>
          <Check className="h-3.5 w-3.5 text-[#35D6A1]" />
          Case Created
        </>
      ) : creating ? (
        "Creating..."
      ) : (
        <>
          Create Case
          <ArrowUpRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}
