"use client";

import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  ShieldAlert,
} from "lucide-react";

interface InvestigationNarrativeProps {
  caseTitle: string;
  caseStatus?: string;
  severity: string;
  selectedEvent?: {
    title: string;
    description: string;
    source: string;
    timestamp?: string;
    entity: {
      name: string;
      type: string;
      technique?: string | null;
    };
  } | null;
  eventCount: number;
  evidenceCount: number;
  finding?: {
    title: string;
    description: string;
    confidence: string;
    status: string;
    technique?: string;
  } | null;
  responseState?: "idle" | "running" | "completed";
  activity?: Array<{
    id: string;
    actor: string;
    action: string;
    field: string | null;
    oldValue: string | null;
    newValue: string | null;
    detail: string | null;
    createdAt: string;
  }>;
}

export function InvestigationNarrative({
  caseTitle,
  caseStatus,
  severity,
  selectedEvent,
  eventCount,
  evidenceCount,
  finding,
  responseState = "idle",
  activity = [],
}: InvestigationNarrativeProps) {
  const technique =
    finding?.technique ??
    selectedEvent?.entity.technique ??
    "Not mapped";

  const entityName =
    selectedEvent?.entity.name ??
    "the affected investigation entity";

  const whatHappened = selectedEvent
    ? `${selectedEvent.title} was observed on ${entityName}. ${selectedEvent.description}`
    : `Investigation activity has been reconstructed for ${caseTitle}.`;

  const whyItMatters =
    finding?.description ??
    (technique !== "Not mapped"
      ? `Observed behavior maps to MITRE technique ${technique}, increasing the significance of the activity.`
      : `The investigation currently contains ${eventCount} correlated event${eventCount === 1 ? "" : "s"} requiring analyst review.`);

  const latestActivity = activity[0];

  const activitySummary =
    latestActivity?.detail ??
    (latestActivity?.action
      ? latestActivity.action.replaceAll("_", " ")
      : "No persisted analyst activity recorded.");

  const currentState =
    latestActivity?.action === "playbook_completed"
      ? "The latest persisted action shows the containment playbook completed successfully."
      : latestActivity?.action === "response_completed"
        ? "The latest persisted action shows the response completed successfully."
        : responseState === "completed"
          ? "Containment or response activity has completed successfully."
          : responseState === "running"
            ? "A response action is currently in progress."
            : caseStatus
              ? `The case is currently in ${caseStatus} state.`
              : "No response action is currently running.";

  return (
    <section className="border-b border-[#263441]/70 bg-[#0B1016]">
      <div className="flex items-center justify-between border-b border-[#263441]/70 px-5 py-3.5">
        <div>
          <div className="text-[13px] font-semibold text-[#E7ECF2]">
            Investigation Narrative
          </div>
          <div className="mt-1 text-[10px] text-[#66717D]">
            Analyst-readable reconstruction of the current investigation
          </div>
        </div>

        <span className="rounded-md border border-[#FFB84D]/20 bg-[#FFB84D]/[0.04] px-2 py-1 text-[8px] font-medium uppercase tracking-[0.08em] text-[#FFB84D]">
          {severity}
        </span>
      </div>

      <div className="grid gap-2 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
        <NarrativeBlock
          icon={<AlertTriangle className="h-3.5 w-3.5 text-[#FFB84D]" />}
          title="What happened"
          body={whatHappened}
        />

        <NarrativeBlock
          icon={<ShieldAlert className="h-3.5 w-3.5 text-[#FF5364]" />}
          title="Why it matters"
          body={whyItMatters}
        />

        <NarrativeBlock
          icon={<FileSearch className="h-3.5 w-3.5 text-[#4DD7E8]" />}
          title="Evidence"
          body={`${evidenceCount} artifact${evidenceCount === 1 ? "" : "s"} linked to the investigation. ${eventCount} correlated event${eventCount === 1 ? "" : "s"} available.`}
        />

        <NarrativeBlock
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-[#35D6A1]" />}
          title="Current state"
          body={`${currentState} ${finding ? `Finding status: ${finding.status}.` : ""} ${activitySummary}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#263441]/70 px-5 py-3 text-[9px]">
        <span className="text-[#59616D]">
          Technique{" "}
          <span className="ml-1 font-mono text-[#35D6FF]">
            {technique}
          </span>
        </span>

        <span className="text-[#59616D]">
          Entity{" "}
          <span className="ml-1 text-[#A7AFBA]">
            {entityName}
          </span>
        </span>

        {finding && (
          <span className="text-[#59616D]">
            Confidence{" "}
            <span className="ml-1 uppercase text-[#35D6A1]">
              {finding.confidence}
            </span>
          </span>
        )}

        {selectedEvent?.source && (
          <span className="text-[#59616D]">
            Source{" "}
            <span className="ml-1 text-[#A7AFBA]">
              {selectedEvent.source}
            </span>
          </span>
        )}
      </div>
    </section>
  );
}

function NarrativeBlock({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[#202A36] bg-[#0E141B] p-3"
    >
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#69727E]">
          {title}
        </div>
      </div>

      <p className="mt-2 text-[10px] leading-5 text-[#A7AFBA]">
        {body}
      </p>
    </motion.div>
  );
}
