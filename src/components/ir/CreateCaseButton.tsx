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
  const [error, setError] = useState<string | null>(null);

  async function createCase() {
    if (creating || created) {
      return;
    }

    setCreating(true);
    setError(null);

    try {
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

      const caseId = `IR-${Date.now()}`;

      const createdCase = {
        id: caseId,
        title: incident.title,
        description: `Investigation case created from Wazuh incident ${incident.id}.`,
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
        createdBy: "Anshuman Pandey",
      };

      const response = await fetch("/api/cases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createdCase),
      });

      const data = (await response.json()) as {
        case?: { id?: string };
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Unable to create case.");
      }

      const savedCaseId = data.case?.id ?? caseId;

      setCreated(true);

      window.setTimeout(() => {
        router.push(`/cases/${encodeURIComponent(savedCaseId)}`);
      }, 250);
    } catch (createError) {
      setCreating(false);
      setCreated(false);
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create case.",
      );
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
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

      {error && (
        <div className="max-w-[260px] text-[9px] leading-4 text-[#FF8A96]">
          {error}
        </div>
      )}
    </div>
  );
}
