"use client";

import { useEffect, useMemo, useState } from "react";
import type { InvestigationEvent } from "@/types/investigation";
import { motion } from "motion/react";
import { CaseLifecycle } from "@/components/ir/CaseLifecycle";
import { ConfirmActionDialog } from "@/components/ir/ConfirmActionDialog";
import { EvidencePreviewDrawer } from "@/components/ir/EvidencePreviewDrawer";
import { FindingBuilder } from "@/components/ir/FindingBuilder";
import { FindingStatusBadge } from "@/components/ir/FindingStatusBadge";
import { FindingAuditTrail } from "@/components/ir/FindingAuditTrail";
import { InvestigationGraph } from "@/components/ir/InvestigationGraph";
import { InvestigationSkeleton } from "@/components/ir/InvestigationSkeleton";
import { RiskEngine } from "@/components/ir/RiskEngine";
import { InvestigationNarrative } from "@/components/ir/InvestigationNarrative";
import { EventCorrelationPanel } from "@/components/ir/EventCorrelationPanel";
import {
  extractInvestigationArtifacts,
  normalizeWazuhAlert,
  type WazuhAlert,
} from "@/lib/investigation/wazuhNormalizer";
import { correlateWazuhAlerts } from "@/lib/investigation/correlation";
import { PlaybookDrawer } from "@/components/ir/PlaybookDrawer";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  FileText,
  Laptop2,
  Link2,
  Network,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  UserRound,
  X,
} from "lucide-react";

type EventItem = InvestigationEvent;

interface WazuhAlertsResponse {
  hits?: {
    hits?: WazuhAlert[];
  };
}

const severityDot: Record<InvestigationEvent["severity"], string> = {
  critical: "bg-[#FF5364]",
  high: "bg-[#FFB84D]",
  medium: "bg-[#4F8CFF]",
  low: "bg-[#35D6A1]",
};


function EventIcon({ event }: { event: InvestigationEvent }) {
  const type = event.entity.type.toLowerCase();

  if (type.includes("process")) {
    return <Terminal className="h-4 w-4" />;
  }

  if (type.includes("user")) {
    return <UserRound className="h-4 w-4" />;
  }

  if (type.includes("network")) {
    return <Network className="h-4 w-4" />;
  }

  return <Laptop2 className="h-4 w-4" />;
}

const severityClass: Record<InvestigationEvent["severity"], string> = {
  critical: "text-[#FF5364]",
  high: "text-[#FFB84D]",
  medium: "text-[#4F8CFF]",
  low: "text-[#35D6A1]",
};

const responseActions: Array<[string, string]> = [
  [
    "Isolate Host",
    "Network containment for the affected endpoint.",
  ],
  [
    "Disable Account",
    "Suspend the affected account to prevent further authentication.",
  ],
  [
    "Block IOC",
    "Block the selected indicator through endpoint and network controls.",
  ],
  [
    "Collect Memory",
    "Acquire a forensic memory image from the affected endpoint.",
  ],
];

interface InvestigationWorkspaceProps {
  initialEventId?: string;
  caseContext?: {
    caseId?: string;
    sourceIncidentId?: string;
    status?: string;
    sourceIp?: string;
    endpoint?: string;
    technique?: string | null;
    title?: string;
    firstSeen?: string;
    lastSeen?: string;
    riskScore?: number;
  };
}

export function InvestigationWorkspace({
  initialEventId = "evt-004",
  caseContext,
}: InvestigationWorkspaceProps) {
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<WazuhAlert[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [loadedRequestKey, setLoadedRequestKey] = useState<string | null>(null);

  const investigationRequestKey = JSON.stringify({
    endpoint: caseContext?.endpoint ?? null,
    sourceIp: caseContext?.sourceIp ?? null,
    technique: caseContext?.technique ?? null,
    title: caseContext?.title ?? null,
    firstSeen: caseContext?.firstSeen ?? null,
    lastSeen: caseContext?.lastSeen ?? null,
  });

  const [retryToken] = useState(0);

  const investigationIsLoading =
    loadedRequestKey !== investigationRequestKey;

  useEffect(() => {
    let cancelled = false;

    const requestKey = JSON.stringify({
      endpoint: caseContext?.endpoint ?? null,
      sourceIp: caseContext?.sourceIp ?? null,
      technique: caseContext?.technique ?? null,
      title: caseContext?.title ?? null,
      firstSeen: caseContext?.firstSeen ?? null,
      lastSeen: caseContext?.lastSeen ?? null,
    });

    const params = new URLSearchParams({
      size: "50",
    });

    if (caseContext?.firstSeen) {
      params.set("since", caseContext.firstSeen);
    }

    if (caseContext?.lastSeen) {
      params.set("until", caseContext.lastSeen);
    }

    if (caseContext?.endpoint) {
      params.set("endpoint", caseContext.endpoint);
    }

    if (caseContext?.sourceIp) {
      params.set("sourceIp", caseContext.sourceIp);
    }

    if (
      caseContext?.technique &&
      caseContext.technique.trim().toLowerCase() !== "not mapped"
    ) {
      params.set("technique", caseContext.technique);
    }

    fetch(`/api/wazuh/alerts?${params.toString()}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Wazuh alerts request failed.");
        }

        return (await response.json()) as WazuhAlertsResponse;
      })
      .then((data) => {
        if (cancelled) {
          return;
        }

        const alerts = data.hits?.hits ?? [];

        const correlatedAlerts = correlateWazuhAlerts(
          alerts,
          {
            sourceIp: caseContext?.sourceIp,
            endpoint: caseContext?.endpoint,
            technique: caseContext?.technique,
            title: caseContext?.title,
          },
          20,
        );

        const normalized = correlatedAlerts.map((alert, index) =>
          normalizeWazuhAlert(alert, index),
        );

        setLiveAlerts(correlatedAlerts);
        setLiveEvents(normalized);
        setEventsError(null);
        setLoadedRequestKey(requestKey);
      })
      .catch((error) => {
        if (!cancelled) {
          setLiveAlerts([]);
          setLiveEvents([]);
          setEventsError(
            error instanceof Error
              ? error.message
              : "Unable to load Wazuh investigation events.",
          );
          setLoadedRequestKey(requestKey);
          }
      });

    return () => {
      cancelled = true;
    };
  }, [
    caseContext?.endpoint,
    caseContext?.sourceIp,
    caseContext?.technique,
    caseContext?.title,
    caseContext?.firstSeen,
    caseContext?.lastSeen,
    retryToken,
  ]);

  const events = useMemo(
    () => liveEvents,
    [liveEvents],
  );

  const investigationArtifacts = useMemo(() => {
    return liveAlerts.flatMap((alert, index) => {
      const event = events.find(
        (item) =>
          item.id ===
          (alert._id ?? alert._source?.id ?? `wazuh-${index}`),
      );

      if (!event) {
        return [];
      }

      return extractInvestigationArtifacts(alert, event);
    });
  }, [events, liveAlerts]);

  const evidence = useMemo(
    () =>
      investigationArtifacts
        .filter((artifact) => artifact.type === "evidence")
        .map(
          (artifact) =>
            [
              artifact.value,
              artifact.category,
              new Intl.DateTimeFormat("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }).format(new Date(artifact.timestamp)),
              "?",
            ] as [string, string, string, string],
        ),
    [investigationArtifacts],
  );

  const iocs = useMemo(
    () =>
      investigationArtifacts
        .filter((artifact) => artifact.type === "ioc")
        .map(
          (artifact) => {
            const isHash = artifact.category === "SHA-256";
            const isIp = artifact.category === "IPv4";

            return [
              artifact.value,
              isHash ? "hash observed" : isIp ? "source IP observed" : "observed",
              isHash ? 70 : isIp ? 45 : 50,
            ] as [string, string, number];
          },
        )
        .filter(
          (ioc, index, collection) =>
            collection.findIndex((item) => item[0] === ioc[0]) === index,
        ),
    [investigationArtifacts],
  );

  const selectEvent = (id: string) => {
    setSelectedId(id);

    if (selectionStorageKey) {
      window.localStorage.setItem(selectionStorageKey, id);
    }
  };

  const selectionStorageKey = caseContext?.caseId
    ? `ir-selected-event:${caseContext.caseId}`
    : null;

  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === "undefined") {
      return initialEventId;
    }

    if (selectionStorageKey) {
      return (
        window.localStorage.getItem(selectionStorageKey) ??
        initialEventId
      );
    }

    return initialEventId;
  });
  const [timelineExpanded, setTimelineExpanded] = useState(false);

  useEffect(() => {
    const handleSearchSelect = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const id = customEvent.detail?.id;

      if (id && events.some((item) => item.id === id)) {
        setSelectedId(id);
      }
    };

    window.addEventListener("ir:search-select-event", handleSearchSelect);

    return () => {
      window.removeEventListener("ir:search-select-event", handleSearchSelect);
    };
  }, [events]);

  const [selectedEvidenceName, setSelectedEvidenceName] = useState<string | null>(null);
  const [findingBuilderOpen, setFindingBuilderOpen] = useState(false);
  const [findingStatus, setFindingStatus] = useState<
    "draft" | "review" | "confirmed"
  >("confirmed");
  const [persistedActivity, setPersistedActivity] = useState<
    Array<{
      id: string;
      actor: string;
      action: string;
      field: string | null;
      oldValue: string | null;
      newValue: string | null;
      detail: string | null;
      createdAt: string;
    }>
  >([]);

  const [findingAuditEvents, setFindingAuditEvents] = useState<
    Array<{
      id: string;
      label: string;
      detail: string;
      time: string;
      tone: "info" | "success" | "warning";
    }>
  >([
    {
      id: "finding-initial",
      label: "Finding loaded",
      detail:
        "Existing analyst finding is supported by the current investigation evidence.",
      time: "09:52",
      tone: "success",
    },
  ]);
  const [findingValidationError, setFindingValidationError] = useState<string | null>(null);
  const [focusedMitreTechnique, setFocusedMitreTechnique] = useState<string | null>(null);
  const [draftFinding, setDraftFinding] = useState<{
    title: string;
    description: string;
    severity: string;
    confidence: string;
    technique: string;
    evidence: string[];
    entities: string[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!caseContext?.caseId) {
      return () => {
        cancelled = true;
      };
    }

    fetch(
      `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings`,
      {
        cache: "no-store",
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load persisted finding.");
        }

        return (await response.json()) as {
          findings?: Array<{
            id: string;
            title: string;
            description: string;
            severity: string;
            confidence: string;
            technique?: string;
            evidenceIds: string[];
            entityIds: string[];
            eventIds: string[];
            status: string;
            author?: string;
            createdAt: string;
            updatedAt: string;
          }>;
        };
      })
      .then(async (data) => {
        if (cancelled) {
          return;
        }

        const finding = data.findings?.[0];

        if (!finding) {
          return;
        }

        const status =
          finding.status === "draft" ||
          finding.status === "review" ||
          finding.status === "confirmed"
            ? finding.status
            : "draft";

        setDraftFinding({
          title: finding.title,
          description: finding.description,
          severity: finding.severity,
          confidence: finding.confidence,
          technique: finding.technique ?? "",
          evidence: finding.evidenceIds,
          entities: finding.entityIds,
        });

        setFindingStatus(status);

        const activityResponse = await fetch(
          `/api/incidents/${encodeURIComponent(caseContext.sourceIncidentId ?? "")}/activity`,
          {
            cache: "no-store",
          },
        );

        if (activityResponse.ok) {
          const activityData = (await activityResponse.json()) as {
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
          };

          setPersistedActivity(activityData.activity ?? []);

          const findingActivities = (activityData.activity ?? []).filter(
            (activity) =>
              activity.action.startsWith("finding_") ||
              activity.field === "finding_status",
          );

          setFindingAuditEvents(
            findingActivities.map((activity) => ({
              id: activity.id,
              label:
                activity.action === "finding_created"
                  ? "Finding created"
                  : activity.action === "finding_review"
                    ? "Finding sent for review"
                    : activity.action === "finding_confirmed"
                      ? "Finding confirmed"
                      : activity.action === "finding_reopened"
                        ? "Finding returned to draft"
                        : "Finding activity",
              detail:
                activity.detail ??
                `${activity.field ?? "Finding"} changed.`,
              time: new Date(activity.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              tone:
                activity.action === "finding_confirmed"
                  ? "success"
                  : activity.action === "finding_reopened"
                    ? "info"
                    : activity.action === "finding_review"
                      ? "warning"
                      : "info",
            })),
          );
        } else {
          setPersistedActivity([]);
          setFindingAuditEvents([]);
        }
      })
      .catch(() => {
        setPersistedActivity([]);
        // Keep the investigation usable even if persisted activity
        // is temporarily unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [caseContext?.caseId, caseContext?.sourceIncidentId]);

  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [playbookRunning, setPlaybookRunning] = useState(false);
  const [playbookCompleted, setPlaybookCompleted] = useState(false);
  const [dismissedFinding, setDismissedFinding] = useState(false);
  const [actionState, setActionState] = useState<
    Record<string, "idle" | "running" | "done">
  >({});
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const selectedEvent =
    events.find((event) => event.id === selectedId) ??
    events[0] ??
    null;

  const entity = selectedEvent?.entity ?? null;

  const correlatedEvents = selectedEvent
    ? events.filter((event) => event.id !== selectedEvent.id).slice(0, 4)
    : [];

  const riskMetrics = useMemo(() => {
    const severityWeights: Record<string, number> = {
      critical: 25,
      high: 18,
      medium: 10,
      low: 4,
    };

    const uniqueTechniques = new Set(
      events
        .map((event) => event.entity.technique)
        .filter((technique): technique is string => Boolean(technique)),
    ).size;

    const maliciousEntities = events.filter(
      (event) => event.entity.verdict === "malicious",
    ).length;

    const suspiciousEntities = events.filter(
      (event) => event.entity.verdict === "suspicious",
    ).length;

    const networkEvents = events.filter((event) =>
      /network|connection|external|lateral|remote|ip/i.test(
        `${event.title} ${event.source} ${event.entity.type}`,
      ),
    ).length;

    const privilegeEvents = events.filter((event) =>
      /admin|administrator|privilege|elevat|credential|root|system/i.test(
        `${event.title} ${event.description} ${Object.values(event.entity.details).join(" ")}`,
      ),
    ).length;

    const evidenceCount = investigationArtifacts.filter(
      (artifact) => artifact.type === "evidence",
    ).length;

    const maxEventRisk = events.reduce(
      (max, event) => Math.max(max, event.entity.risk),
      0,
    );

    const severityContribution = events.reduce(
      (total, event) =>
        total + (severityWeights[event.severity] ?? 0),
      0,
    );

    const baseScore = Math.min(
      60,
      Math.max(
        10,
        Math.round(
          maxEventRisk * 0.55 +
            Math.min(severityContribution, 60) * 0.25 +
            Math.min(events.length * 2, 30) * 0.2,
        ),
      ),
    );

    return {
      baseScore,
      assetCriticality: caseContext?.endpoint ? 15 : 5,
      iocReputation: Math.min(
        20,
        maliciousEntities * 8 + suspiciousEntities * 4,
      ),
      privilegeLevel: Math.min(15, privilegeEvents * 5),
      mitreTechniques: Math.min(20, uniqueTechniques * 4),
      lateralMovement: Math.min(15, networkEvents * 3),
      dataAccess: Math.min(10, evidenceCount * 2),
      maxEventRisk,
      uniqueTechniques,
      maliciousEntities,
      suspiciousEntities,
      networkEvents,
      privilegeEvents,
      evidenceCount,
    };
  }, [caseContext?.endpoint, events, investigationArtifacts]);

  const calculatedRiskScore = Math.min(
    100,
    Math.max(
      0,
      riskMetrics.baseScore +
        riskMetrics.iocReputation +
        riskMetrics.privilegeLevel +
        riskMetrics.mitreTechniques +
        riskMetrics.lateralMovement +
        riskMetrics.dataAccess,
    ),
  );

  useEffect(() => {
    if (!caseContext?.caseId || events.length === 0) {
      return;
    }

    const currentPersistedScore = Number(caseContext.riskScore ?? 0);

    if (currentPersistedScore === calculatedRiskScore) {
      return;
    }

    fetch(
      `/api/cases/${encodeURIComponent(caseContext.caseId)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          riskScore: calculatedRiskScore,
        }),
      },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to persist calculated risk score.");
        }

        return response.json();
      })
      .catch(() => {
        // Keep the live risk calculation usable even if persistence fails.
      });

  }, [
    caseContext?.caseId,
    caseContext?.riskScore,
    calculatedRiskScore,
    events.length,
  ]);

  if (!selectedEvent) {
    return (
      <section className="ir-console overflow-hidden rounded-2xl border border-[#263441] bg-[#08090B]">
        <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_280px] xl:grid-cols-[235px_minmax(0,1fr)_300px]">
          <aside className="border-b border-[#263441]/70 xl:border-b-0 xl:border-r">
            <div className="border-b border-[#263441]/70 px-5 py-4">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#E7ECF2]">
                Investigation Timeline
              </h2>
              <p className="mt-1 text-[10px] text-[#69727E]">
                Reconstructed event sequence
              </p>
            </div>

            <div className="px-3 py-4">
              {investigationIsLoading ? (
                <InvestigationSkeleton />
              ) : eventsError ? (
                <div className="rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05] px-3 py-4 text-[10px] leading-4 text-[#FF8A96]">
                  {eventsError}
                </div>
              ) : (
                <div className="rounded-lg border border-[#263441] bg-[#10151C] px-3 py-4 text-[10px] leading-4 text-[#69727E]">
                  No correlated Wazuh events were found for this investigation.
                </div>
              )}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="flex min-h-[430px] items-center justify-center px-6 py-12">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-[#263441] bg-[#10151C] text-[#59616D]">
                  <ShieldAlert className="h-4 w-4" />
                </div>

                <div className="mt-4 text-[12px] font-medium text-[#A7AFBA]">
                  No investigation event selected
                </div>

                <p className="mt-1.5 text-[10px] leading-5 text-[#596674]">
                  {investigationIsLoading
                    ? "Wazuh investigation telemetry is loading."
                    : eventsError
                      ? "The investigation telemetry request failed. Check the error in the timeline."
                      : "No correlated Wazuh events are available for the current case context."}
                </p>
              </div>
            </div>
          </main>
        </div>
      </section>
    );
  }

  const selectedEvidence = evidence.find(
    ([name]) => name === selectedEvidenceName,
  );

  const evidencePreview = selectedEvidence
    ? {
        name: selectedEvidence[0],
        type: selectedEvidence[1],
        collected: selectedEvidence[2],
        size: selectedEvidence[3],
        source: selectedEvent.source,
        hash:
          selectedEvent.entity.details.Hashes
            ?.replace(/^SHA256=/i, "")
            .split(",")[0]
            .trim() || "Not available",
        custody: `Observed at ${selectedEvidence[2]} from ${selectedEvent.source}.`,
        relatedEvent: selectedEvent.title,
        relatedEntity: entity?.name ?? "Unknown",
      }
    : null;

  const selectedResponseAction =
    responseActions.find(([name]) => name === confirmAction) ?? null;

  const narrativeSeverity = selectedEvent.severity;


  const playbookSteps = [
    {
      id: "pb-01",
      title: "Validate detection",
      description: "Confirm credential-access indicators on the affected endpoint.",
      status: "completed" as const,
    },
    {
      id: "pb-02",
      title: "Collect evidence",
      description: "Acquire memory and endpoint artifacts for investigation.",
      status: "completed" as const,
    },
    {
      id: "pb-03",
      title: "Isolate endpoint",
      description: "Apply network containment to WIN-10-23-17.",
      status: playbookRunning ? "running" as const : playbookCompleted ? "completed" as const : "pending" as const,
    },
    {
      id: "pb-04",
      title: "Disable compromised account",
      description: "Suspend j.smith credentials and prevent further authentication.",
      status: playbookCompleted ? "completed" as const : "pending" as const,
    },
    {
      id: "pb-05",
      title: "Block malicious IOC",
      description: "Block 185.199.109.153 through network and endpoint controls.",
      status: playbookCompleted ? "completed" as const : "pending" as const,
    },
  ];

  const executeAction = (name: string) => {
    setConfirmAction(name);
  };

  const validateFinding = () => {
    if (!draftFinding?.title.trim()) {
      return "Finding title is required.";
    }

    if (!draftFinding.description.trim()) {
      return "Finding description is required.";
    }

    if (!draftFinding.technique.trim()) {
      return "MITRE technique is required.";
    }

    if (draftFinding.evidence.length === 0) {
      return "At least one evidence artifact is required.";
    }

    if (draftFinding.entities.length === 0) {
      return "At least one entity must be linked.";
    }

    return null;
  };

  const recordFindingActivity = async ({
    action,
    field,
    oldValue,
    newValue,
    detail,
  }: {
    action: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    detail: string;
  }) => {
    const incidentId = caseContext?.sourceIncidentId;

    if (!incidentId) {
      return;
    }

    try {
      await fetch(
        `/api/incidents/${encodeURIComponent(incidentId)}/activity`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            actor: "Anshuman Pandey",
            action,
            field,
            oldValue,
            newValue,
            detail,
          }),
        },
      );
    } catch {
      // Keep the investigation usable if audit persistence is temporarily unavailable.
    }
  };

  const confirmFinding = async () => {
    const validationError = validateFinding();

    if (validationError) {
      setFindingValidationError(validationError);
      return;
    }

    if (!caseContext?.caseId || !draftFinding) {
      setFindingValidationError("No persisted finding is available to approve.");
      return;
    }

    try {
      const response = await fetch(
        `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load persisted finding.");
      }

      const data = (await response.json()) as {
        findings?: Array<{ id: string; status: string }>;
      };

      const finding = data.findings?.[0];

      if (!finding) {
        throw new Error("No persisted finding was found for this case.");
      }

      const updateResponse = await fetch(
        `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings/${encodeURIComponent(finding.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "confirmed",
          }),
        },
      );

      const updateData = (await updateResponse.json()) as {
        error?: string;
      };

      if (!updateResponse.ok) {
        throw new Error(
          updateData.error ?? "Unable to confirm finding.",
        );
      }

      await recordFindingActivity({
        action: "finding_confirmed",
        field: "finding_status",
        oldValue: finding.status,
        newValue: "confirmed",
        detail: "The finding passed validation and was approved.",
      });

      setFindingValidationError(null);
      setFindingStatus("confirmed");

      setFindingAuditEvents((current) => [
        ...current,
        {
          id: `finding-confirmed-${Date.now()}`,
          label: "Finding confirmed",
          detail:
            "The finding passed validation and was approved.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tone: "success",
        },
      ]);
    } catch (error) {
      setFindingValidationError(
        error instanceof Error
          ? error.message
          : "Unable to confirm finding.",
      );
    }
  };

  const focusMitreTechnique = (technique: string) => {
    setFocusedMitreTechnique(technique);

    const matchingEvent = events.find(
      (event) => event.entity.technique === technique,
    );

    if (matchingEvent) {
      setSelectedId(matchingEvent.id);
    }
  };

  const submitFindingForReview = async () => {
    const validationError = validateFinding();

    if (validationError) {
      setFindingValidationError(validationError);
      return;
    }

    if (!caseContext?.caseId || !draftFinding) {
      setFindingValidationError("No persisted finding is available for review.");
      return;
    }

    try {
      const response = await fetch(
        `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Unable to load persisted finding.");
      }

      const data = (await response.json()) as {
        findings?: Array<{ id: string; status: string }>;
      };

      const finding = data.findings?.[0];

      if (!finding) {
        throw new Error("No persisted finding was found for this case.");
      }

      const updateResponse = await fetch(
        `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings/${encodeURIComponent(finding.id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "review",
          }),
        },
      );

      const updateData = (await updateResponse.json()) as {
        error?: string;
      };

      if (!updateResponse.ok) {
        throw new Error(
          updateData.error ?? "Unable to submit finding for review.",
        );
      }

      await recordFindingActivity({
        action: "finding_review",
        field: "finding_status",
        oldValue: finding.status,
        newValue: "review",
        detail:
          "The finding passed validation and was submitted for analyst review.",
      });

      setFindingValidationError(null);
      setFindingStatus("review");

      setFindingAuditEvents((current) => [
        ...current,
        {
          id: `finding-review-${Date.now()}`,
          label: "Finding sent for review",
          detail:
            "The finding passed validation and was submitted for analyst review.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tone: "warning",
        },
      ]);
    } catch (error) {
      setFindingValidationError(
        error instanceof Error
          ? error.message
          : "Unable to submit finding for review.",
      );
    }
  };

  const confirmResponseAction = async () => {
    if (!confirmAction) return;

    const name = confirmAction;

    const target =
      name === "Isolate Host"
        ? caseContext?.endpoint ?? "Unknown endpoint"
        : name === "Disable Account"
          ? entity?.name ?? "Unknown account"
          : name === "Block IOC"
            ? iocs[0]?.[0] ?? caseContext?.sourceIp ?? "Unknown IOC"
            : caseContext?.endpoint ?? "Unknown endpoint";

    const description =
      name === "Isolate Host"
        ? "Network containment for the affected endpoint."
        : name === "Disable Account"
          ? "Suspend the affected account to prevent further authentication."
          : name === "Block IOC"
            ? "Block the selected indicator through endpoint and network controls."
            : "Acquire a forensic memory image from the affected endpoint.";

    try {
      setActionState((current) => ({
        ...current,
        [name]: "running",
      }));

      const createResponse = await fetch(
        `/api/cases/${encodeURIComponent(caseContext?.caseId ?? "")}/response-actions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            target,
            description,
          }),
        },
      );

      const createData = (await createResponse.json()) as {
        action?: {
          id: string;
        };
        error?: string;
      };

      if (!createResponse.ok || !createData.action?.id) {
        throw new Error(
          createData.error ?? "Unable to create response action.",
        );
      }

      const actionId = createData.action.id;

      await recordFindingActivity({
        action: "response_started",
        field: "response_action",
        oldValue: "idle",
        newValue: "running",
        detail: `${name} started against ${target}.`,
      });

      setFindingAuditEvents((current) => [
        ...current,
        {
          id: `response-started-${Date.now()}`,
          label: `${name} started`,
          detail: `Response action initiated against ${target}.`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tone: "warning",
        },
      ]);

      const runningResponse = await fetch(
        `/api/cases/${encodeURIComponent(caseContext?.caseId ?? "")}/response-actions/${encodeURIComponent(actionId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "running",
          }),
        },
      );

      if (!runningResponse.ok) {
        throw new Error("Unable to mark response action as running.");
      }

      const completedResponse = await fetch(
        `/api/cases/${encodeURIComponent(caseContext?.caseId ?? "")}/response-actions/${encodeURIComponent(actionId)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "succeeded",
          }),
        },
      );

      const completedData = (await completedResponse.json()) as {
        error?: string;
      };

      if (!completedResponse.ok) {
        throw new Error(
          completedData.error ??
            "Unable to complete response action.",
        );
      }

      setActionState((current) => ({
        ...current,
        [name]: "done",
      }));

      await recordFindingActivity({
        action: "response_completed",
        field: "response_action",
        oldValue: "running",
        newValue: "succeeded",
        detail: `${name} completed successfully against ${target}.`,
      });

      setFindingAuditEvents((current) => [
        ...current,
        {
          id: `response-completed-${Date.now()}`,
          label: `${name} completed`,
          detail: `The ${name.toLowerCase()} response action completed successfully.`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          tone: "success",
        },
      ]);

      setConfirmAction(null);
    } catch (error) {
      setActionState((current) => ({
        ...current,
        [name]: "idle",
      }));

      setFindingValidationError(
        error instanceof Error
          ? error.message
          : "Unable to execute response action.",
      );
    }
  };

  return (
    <section className="ir-console overflow-hidden rounded-2xl border border-[#263441] bg-[#08090B]">
      <InvestigationNarrative
        caseTitle={caseContext?.title ?? "Active investigation"}
        caseStatus={caseContext?.status}
        severity={narrativeSeverity}
        selectedEvent={{
          title: selectedEvent.title,
          description: selectedEvent.description,
          source: selectedEvent.source,
          timestamp: selectedEvent.timestamp,
          entity: {
            name: selectedEvent.entity.name,
            type: selectedEvent.entity.type,
            technique: selectedEvent.entity.technique,
          },
        }}
        eventCount={events.length}
        evidenceCount={evidence.length}
        finding={
          draftFinding
            ? {
                title: draftFinding.title,
                description: draftFinding.description,
                confidence: draftFinding.confidence,
                status: findingStatus,
                technique: draftFinding.technique,
              }
            : null
        }
        responseState={
          Object.values(actionState).some((state) => state === "running")
            ? "running"
            : Object.values(actionState).some((state) => state === "done")
              ? "completed"
              : "idle"
        }
        activity={persistedActivity}
      />

      <div className="grid lg:grid-cols-[220px_minmax(0,1fr)_280px] xl:grid-cols-[235px_minmax(0,1fr)_300px]">
        <aside className="border-b border-[#263441]/70 xl:border-b-0 xl:border-r">
          <div className="border-b border-[#263441]/70 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-[#E7ECF2]">
                  Investigation Timeline
                </h2>
                <p className="mt-1 text-[10px] text-[#69727E]">
                  Reconstructed event sequence
                </p>
              </div>

              <span className="rounded-md border border-[#263441] px-2 py-1 text-[9px] text-[#69727E]">
                {events.length}
              </span>
            </div>
          </div>

          <div className="px-3 py-4">
            <div
              className={`relative overflow-y-auto pr-1 ${
                timelineExpanded ? "max-h-[720px]" : "max-h-[430px]"
              }`}
            >
              <div className="relative">
                <div className="absolute bottom-3 left-[55px] top-3 w-px bg-[#263441]/70" />

                <div className="space-y-1">
                  {investigationIsLoading ? (
                    <div className="rounded-lg border border-[#263441] bg-[#10151C] px-3 py-4 text-[10px] text-[#69727E]">
                      Loading Wazuh events...
                    </div>
                  ) : eventsError ? (
                    <div className="rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05] px-3 py-4 text-[10px] leading-4 text-[#FF8A96]">
                      {eventsError}
                    </div>
                  ) : events.length === 0 ? (
                    <div className="rounded-lg border border-[#263441] bg-[#10151C] px-3 py-4 text-[10px] leading-4 text-[#69727E]">
                      No correlated Wazuh events were found for this investigation.
                    </div>
                  ) : (
                    events.map((event) => {
                      const selected = event.id === selectedId;

                      return (
                        <button
                          key={event.id}
                          id={`timeline-event-${event.id}`}
                          type="button"
                          onClick={() => selectEvent(event.id)}
                          className={`relative flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left transition ${
                            selected
                              ? "bg-[#4F8CFF]/[0.07] shadow-[inset_2px_0_0_#4F8CFF,0_0_18px_rgba(77,163,255,0.10)]"
                              : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="relative z-10 flex w-[42px] shrink-0 justify-center pt-1">
                            <span
                              className={`h-2 w-2 rounded-full ring-4 ring-[#08090B] ${
                                severityDot[event.severity]
                              }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-[#8B93A1]">
                                {event.time}
                              </span>

                              <span
                                className={`text-[9px] font-semibold uppercase ${severityClass[event.severity]}`}
                              >
                                {event.severity}
                              </span>
                            </div>

                            <div
                              className={`mt-0.5 text-[11px] font-medium ${
                                selected ? "text-white" : "text-[#C7CDD6]"
                              }`}
                            >
                              {event.title}
                            </div>

                            <div className="mt-1 text-[11px] leading-4.5 text-[#69727E]">
                              {event.description}
                            </div>
                          </div>

                          {selected && (
                            <motion.div
                              layoutId="timeline-active"
                              className="absolute right-1 top-2 bottom-2 w-0.5 rounded-full bg-[#4F8CFF] shadow-[0_0_10px_rgba(47,129,255,0.75)]"
                            />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[#263441]/70 px-5 py-3">
            <button
              type="button"
              onClick={() => {
                setTimelineExpanded((current) => !current);
              }}
              className="flex w-full items-center justify-between text-[10px] text-[#69727E] transition hover:text-white"
            >
              <span>
                {timelineExpanded ? "Show less" : "View complete timeline"}
              </span>

              <ArrowUpRight
                className={`h-3.5 w-3.5 transition-transform ${
                  timelineExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

          </div>

          <div className="mt-4 px-3">
            <CaseLifecycle
              status={
                caseContext?.status === "detected" ||
                caseContext?.status === "triage" ||
                caseContext?.status === "investigating" ||
                caseContext?.status === "confirmed" ||
                caseContext?.status === "contained" ||
                caseContext?.status === "eradication" ||
                caseContext?.status === "recovery" ||
                caseContext?.status === "closed"
                  ? caseContext.status
                  : "investigating"
              }
              eventsCount={events.length}
              evidenceCount={evidence.length}
              iocCount={iocs.length}
            />
</div>
        </aside>

        <main className="min-w-0">
          <div className="border-b border-[#263441]/70 px-6 py-3.5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#69727E]">
                    Selected Event
                  </span>

                  <span
                    className={`rounded-md border border-current/20 bg-current/[0.05] px-2 py-1 text-[9px] font-semibold uppercase ${severityClass[selectedEvent.severity]}`}
                  >
                    {selectedEvent.severity}
                  </span>
                </div>

                <motion.div
                  key={selectedEvent.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="mt-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] text-[#4F8CFF]">
                      <EventIcon event={selectedEvent} />
                    </div>

                    <div>
                      <h2 className="text-[21px] font-semibold tracking-tight text-[#E7ECF2]">
                        {selectedEvent.title}
                      </h2>

                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-[#66717D]">
                        <span>{selectedEvent.time}</span>
                        <span className="text-[#344255]">&middot;</span>
                        <span>{selectedEvent.source}</span>
                        <span className="text-[#344255]">&middot;</span>
                        <span>{selectedEvent.entity.type}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedId(selectedEvent.id);
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById(`timeline-event-${selectedEvent.id}`)
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                  });
                }}
                className="flex h-9 items-center justify-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 text-[10px] text-[#A7AFBA] transition hover:border-[#2A313A] hover:text-white"
              >
                Open event
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="border-b border-[#263441]/70 px-6 py-4">
            <div className="grid gap-x-10 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-3">
              {Object.entries({
                Timestamp: selectedEvent.time,
                Host: selectedEvent.entity.details.Host ?? caseContext?.endpoint ?? "Unknown",
                User: selectedEvent.entity.details.User ?? "Unknown",
                Process: selectedEvent.entity.name,
                Source: selectedEvent.source,
                Technique: selectedEvent.entity.technique ?? "?",
              }).map(([label, value]) => (
                <div key={label}>
                  <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                    {label}
                  </div>
                  <div
                    className={`mt-1.5 text-[12px] ${
                      label === "Technique"
                        ? "font-mono text-[#4F8CFF]"
                        : "text-[#C7CDD6]"
                    }`}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3.5 border-t border-[#1B2430] pt-3">
              <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                Description
              </div>

              <p className="mt-1.5 max-w-4xl text-[12px] leading-5.5 text-[#9AA6B2]">
                {selectedEvent.description}
              </p>
            </div>
          </div>

          <div className="grid border-b border-[#263441]/70 lg:grid-cols-2">
            <section
              id="evidence-section"
              className="min-w-0 border-b border-[#263441]/70 bg-[#0C1117] px-5 py-4 lg:border-b-0 lg:border-r"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#35D6FF]" />
                    <h3 className="text-[14px] font-semibold text-[#F5F7FA]">
                      Evidence
                    </h3>
                  </div>

                  <p className="mt-1 text-[9px] text-[#69727E]">
                    Artifacts supporting the selected event
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    document
                      .getElementById("evidence-section")
                      ?.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                      });
                  }}
                  className="text-[9px] text-[#35D6FF] hover:text-[#62E3FF]"
                >
                  View all
                </button>
              </div>

              <div className="mt-3 divide-y divide-[#263441]/60">
                {evidence.map(([name, type, collected, size]) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedEvidenceName(name)}
                    className="group flex w-full items-center gap-3 rounded-md px-1 py-2.5 text-left transition hover:bg-white/[0.018]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#263441] bg-[#121A22] text-[#35D6FF]">
                      <FileText className="h-3 w-3" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[10px] font-medium text-[#D9DEE7]">
                        {name}
                      </div>
                      <div className="mt-0.5 text-[8px] text-[#69727E]">
                        {type}
                      </div>
                    </div>

                    <div className="hidden text-right xl:block">
                      <div className="text-[8px] text-[#59616D]">
                        {collected}
                      </div>
                    </div>

                    <div className="w-[58px] text-right text-[9px] text-[#69727E]">
                      {size}
                    </div>

                    <ChevronRight className="h-3 w-3 shrink-0 text-[#464D56]" />
                  </button>
                ))}
              </div>
            </section>

            <section className="min-w-0 px-5 py-4 bg-[#0B0F14]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-[#7C6CFF]" />
                    <h3 className="text-[14px] font-semibold text-[#F5F7FA]">
                      Related Activity
                    </h3>
                  </div>

                  <p className="mt-1 text-[9px] text-[#69727E]">
                    Events connected to the selected activity
                  </p>
                </div>

                <span className="font-mono text-[9px] text-[#7C6CFF]">
                  {events.slice(4).length} EVENTS
                </span>
              </div>

              <div className="mt-3 divide-y divide-[#263441]/60">
                {events.slice(4).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => selectEvent(event.id)}
                    className="group flex w-full items-center gap-2.5 rounded-md px-1 py-2 text-left transition hover:bg-white/[0.018]"
                  >
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${severityDot[event.severity]}`}
                    />

                    <span className="font-mono text-[10px] text-[#66717D]">
                      {event.time}
                    </span>

                    <span className="min-w-0 flex-1 truncate text-[11px] text-[#C7CDD6]">
                      {event.title}
                    </span>

                    <span className="hidden text-[8px] text-[#59616D] sm:block">
                      {event.source}
                    </span>

                    <ChevronRight className="h-3 w-3 shrink-0 text-[#464D56]" />
                  </button>
                ))}
              </div>
            </section>
          </div>

          <EventCorrelationPanel
            events={correlatedEvents}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />

          <InvestigationGraph
            events={events.map((event) => ({
              id: event.id,
              title: event.title,
              timestamp: event.timestamp,
              entity: {
                name: event.entity.name,
                type: event.entity.type,
                technique: event.entity.technique,
              },
            }))}
            highlightedTechnique={focusedMitreTechnique}
            onTraceSelect={(_, eventId) => {
              if (eventId) {
                setSelectedId(eventId);
              }
            }}
            selectedNodeId={
              entity.name
                ? `${
                    /process|malware/i.test(entity.type)
                      ? "malware"
                      : /user|account/i.test(entity.type)
                        ? "account"
                        : /network|ip/i.test(entity.type)
                          ? "ip"
                          : "endpoint"
                  }:${entity.name}`
                : undefined
            }
            onSelect={(node) => {
              const nodeEvent = events.find(
                (item) =>
                  item.entity.name === node.label &&
                  (
                    /process|malware/i.test(item.entity.type)
                      ? "malware"
                      : /user|account/i.test(item.entity.type)
                        ? "account"
                        : /network|ip/i.test(item.entity.type)
                          ? "ip"
                          : "endpoint"
                  ) === node.type,
              );

              if (nodeEvent) {
                setSelectedId(nodeEvent.id);
              }
            }}
          />

{!dismissedFinding && (
            <div className="border-b border-[#263441]/70 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#7C6CFF]" />
                  <h3 className="text-[15px] font-semibold text-[#F5F7FA]">
                    Analyst Finding
                  </h3>
                  <FindingStatusBadge status={findingStatus} />
                </div>

                <div className="flex items-center gap-2">
                  {draftFinding && findingStatus === "draft" && (
                    <button
                      type="button"
                      onClick={submitFindingForReview}
                      className="rounded-lg border border-[#FFB84D]/20 bg-[#FFB84D]/[0.04] px-3 py-1.5 text-[9px] font-medium text-[#FFB84D] transition hover:border-[#FFB84D]/35 hover:bg-[#FFB84D]/[0.07]"
                    >
                      Send for Review
                    </button>
                  )}

                  {draftFinding && findingStatus === "review" && (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                        if (!caseContext?.caseId) {
                          setFindingValidationError(
                            "No case is available for reopening the finding.",
                          );
                          return;
                        }

                        try {
                          const response = await fetch(
                            `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings`,
                            {
                              method: "GET",
                              cache: "no-store",
                            },
                          );

                          if (!response.ok) {
                            throw new Error(
                              "Unable to load persisted finding.",
                            );
                          }

                          const data = (await response.json()) as {
                            findings?: Array<{ id: string }>;
                          };

                          const finding = data.findings?.[0];

                          if (!finding) {
                            throw new Error(
                              "No persisted finding was found for this case.",
                            );
                          }

                          const updateResponse = await fetch(
                            `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings/${encodeURIComponent(finding.id)}`,
                            {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                status: "draft",
                              }),
                            },
                          );

                          const updateData =
                            (await updateResponse.json()) as {
                              error?: string;
                            };

                          if (!updateResponse.ok) {
                            throw new Error(
                              updateData.error ??
                                "Unable to reopen finding.",
                            );
                          }

                          await recordFindingActivity({
                            action: "finding_reopened",
                            field: "finding_status",
                            oldValue: "confirmed",
                            newValue: "draft",
                            detail:
                              "The finding was reopened for additional analyst review.",
                          });

                          setFindingValidationError(null);
                          setFindingStatus("draft");

                          setFindingAuditEvents((current) => [
                            ...current,
                            {
                              id: `finding-reopened-${Date.now()}`,
                              label: "Finding returned to draft",
                              detail:
                                "The finding was reopened for additional analyst review.",
                              time: new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }),
                              tone: "info",
                            },
                          ]);
                        } catch (error) {
                          setFindingValidationError(
                            error instanceof Error
                              ? error.message
                              : "Unable to reopen finding.",
                          );
                        }
                      }}
                        className="rounded-lg border border-[#263441] px-3 py-1.5 text-[9px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
                      >
                        Return to Draft
                      </button>

                      <button
                        type="button"
                        onClick={confirmFinding}
                        className="rounded-lg border border-[#35D6A1]/20 bg-[#35D6A1]/[0.04] px-3 py-1.5 text-[9px] font-medium text-[#35D6A1] transition hover:border-[#35D6A1]/35 hover:bg-[#35D6A1]/[0.07]"
                      >
                        Approve Finding
                      </button>
                    </>
                  )}

                  {draftFinding && findingStatus === "confirmed" && (
                    <button
                      type="button"
                      onClick={() => {
                        void recordFindingActivity({
                          action: "finding_reopened",
                          field: "finding_status",
                          oldValue: "confirmed",
                          newValue: "draft",
                          detail:
                            "The finding was reopened for additional analyst review.",
                        });

                        setFindingStatus("draft");
                        setFindingAuditEvents((current) => [
                          ...current,
                          {
                            id: `finding-reopened-${Date.now()}`,
                            label: "Finding returned to draft",
                            detail:
                              "The finding was reopened for additional analyst review.",
                            time: new Date().toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            }),
                            tone: "info",
                          },
                        ]);
                      }}
                      className="rounded-lg border border-[#263441] px-3 py-1.5 text-[9px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
                    >
                      Re-open
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setFindingBuilderOpen(true)}
                    className="rounded-lg border border-[#7C6CFF]/18 bg-[#7C6CFF]/[0.025] px-3 py-1.5 text-[9px] font-medium text-[#8B82FF] transition hover:border-[#7C6CFF]/30 hover:bg-[#7C6CFF]/[0.05]"
                  >
                    + Create Finding
                  </button>

                  <button
                    type="button"
                    onClick={() => setDismissedFinding(true)}
                    className="rounded-md p-1 text-[#59616D] hover:text-white"
                    aria-label="Dismiss finding"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3.5">
                <div className="max-w-4xl text-[16px] font-medium leading-6.5 text-[#E7ECF2]">
                  {draftFinding?.title ??
                    "Credential dumping confirmed through LSASS memory access using mimikatz.exe."}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px]">
                  <div>
                    <span className="text-[#59616D]">Confidence</span>
                    <span className="ml-2 text-[#35D6A1]">HIGH</span>
                  </div>

                  <div className="border-l border-[#253142] pl-5">
                    <span className="text-[#59616D]">Status</span>
                    <span
                      className={`ml-2 ${
                        findingStatus === "confirmed"
                          ? "text-[#35D6A1]"
                          : findingStatus === "review"
                            ? "text-[#FFB84D]"
                            : "text-[#A7AFBA]"
                      }`}
                    >
                      {findingStatus.toUpperCase()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      focusMitreTechnique(
                        draftFinding?.technique ?? "T1003.001",
                      )
                    }
                    className={`text-left transition ${
                      focusedMitreTechnique ===
                      (draftFinding?.technique ?? "T1003.001")
                        ? "text-[#4DD7E8]"
                        : ""
                    }`}
                  >
                    <span className="text-[#59616D]">MITRE</span>
                    <span
                      className={`ml-2 font-mono ${
                        focusedMitreTechnique ===
                        (draftFinding?.technique ?? "T1003.001")
                          ? "text-[#4DD7E8]"
                          : "text-[#35D6FF]"
                      }`}
                    >
                      {draftFinding?.technique ?? "T1003.001"}
                    </span>

                    <span className="ml-2 text-[9px] text-[#59616D] opacity-0 transition group-hover:opacity-100">
                      Focus
                    </span>
                  </button>

                  <div>
                    <span className="text-[#59616D]">Evidence</span>
                    <span className="ml-2 text-[#35D6FF]">
                      {draftFinding?.evidence?.length ?? evidence.length} artifacts
                    </span>
                  </div>

                  <div>
                    <span className="text-[#59616D]">Entities</span>
                    <span className="ml-2 text-[#7C6CFF]">
                      {draftFinding?.entities?.length ?? 3}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#59616D]">Analyst</span>
                    <span className="ml-2 text-[#A7AFBA]">
                      Anshuman Pandey
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {findingValidationError && (
            <div className="mx-6 mb-4 rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05] px-3 py-2.5">
              <div className="text-[10px] font-medium text-[#FF5364]">
                Finding cannot be approved
              </div>
              <div className="mt-1 text-[9px] leading-4 text-[#A7AFBA]">
                {findingValidationError}
              </div>
            </div>
          )}

          <FindingAuditTrail events={findingAuditEvents} />
        </main>

        <aside className="border-t border-[#263441] bg-[#0B1016] xl:border-l xl:border-t-0">
          <div className="border-b border-[#263441]/70 px-4 py-3.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[#59616D]">
                  Selected Entity
                </div>
                <div className="mt-1 text-[13px] font-semibold text-[#F5F7FA]">
                  Entity Inspector
                </div>
              </div>

              <span className="rounded-md border border-[#35D6FF]/15 bg-[#35D6FF]/[0.04] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.08em] text-[#35D6FF]">
                Live Context
              </span>
            </div>
          </div>

          <motion.div
            key={entity.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="p-4"
          >
            <div className="rounded-xl border border-[#FF5364]/20 bg-[#FF5364]/[0.035] p-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.06]">
                  <Terminal className="h-4 w-4 text-[#FF5364]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#E7ECF2]">
                    {entity.name}
                  </div>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#69727E]">
                      {entity.type}
                    </span>

                    <span className="text-[#344255]">&middot;</span>

                    <span className="text-[8px] font-medium uppercase tracking-[0.08em] text-[#FF5364]">
                      {entity.verdict}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-[0.08em] text-[#66717D]">
                    Risk
                  </div>

                  <div className="mt-0.5 text-[16px] font-semibold text-[#FF5364]">
                    {Math.min(
                      100,
                      Math.max(
                        0,
                        riskMetrics.baseScore +
                          riskMetrics.iocReputation +
                          riskMetrics.privilegeLevel +
                          riskMetrics.mitreTechniques +
                          riskMetrics.lateralMovement +
                          riskMetrics.dataAccess,
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>

            <details className="mt-5 border-t border-[#263441]/70 pt-4">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                    Risk Analysis
                  </div>

                  <div className="mt-1 text-[9px] text-[#69727E]">
                    Explain why this entity is high risk
                  </div>
                </div>

                <span className="rounded-md border border-[#FFB84D]/20 bg-[#FFB84D]/[0.04] px-2 py-1 text-[8px] font-medium text-[#FFB84D]">
                  {(() => {
                    const score = Math.min(
                      100,
                      Math.max(
                        0,
                        riskMetrics.baseScore +
                          riskMetrics.iocReputation +
                          riskMetrics.privilegeLevel +
                          riskMetrics.mitreTechniques +
                          riskMetrics.lateralMovement +
                          riskMetrics.dataAccess,
                      ),
                    );

                    return score >= 90
                      ? "CRITICAL"
                      : score >= 70
                        ? "HIGH"
                        : score >= 40
                          ? "MEDIUM"
                          : "LOW";
                  })()}
                </span>
              </summary>

              <div className="mt-4">
                <RiskEngine
                  score={riskMetrics.baseScore}
                  factors={[
                    {
                      label: "Asset Criticality",
                      value: riskMetrics.assetCriticality,
                      icon: "asset",
                      reason: caseContext?.endpoint
                        ? `Affected endpoint ${caseContext.endpoint} is part of the active investigation.`
                        : "No affected endpoint was supplied by the investigation context.",
                    },
                    {
                      label: "IOC Reputation",
                      value: riskMetrics.iocReputation,
                      icon: "ioc",
                      reason: `${riskMetrics.maliciousEntities} malicious and ${riskMetrics.suspiciousEntities} suspicious entities observed.`,
                    },
                    {
                      label: "Privilege Level",
                      value: riskMetrics.privilegeLevel,
                      icon: "privilege",
                      reason: `${riskMetrics.privilegeEvents} events matched privilege or credential activity.`,
                    },
                    {
                      label: "MITRE Techniques",
                      value: riskMetrics.mitreTechniques,
                      icon: "mitre",
                      reason: `${riskMetrics.uniqueTechniques} unique MITRE techniques observed across correlated events.`,
                    },
                    {
                      label: "Lateral Movement",
                      value: riskMetrics.lateralMovement,
                      icon: "lateral",
                      reason: `${riskMetrics.networkEvents} network, connection, or lateral-movement events observed.`,
                    },
                    {
                      label: "Data Access",
                      value: riskMetrics.dataAccess,
                      icon: "data",
                      reason: `${riskMetrics.evidenceCount} evidence artifacts are linked to the investigation.`,
                    },
                  ]}
                />
              </div>
            </details>


            <div className="mt-5 border-t border-[#1B2430] pt-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5B8CFF]" />

                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#66717D]">
                  Process Context
                </span>
              </div>

              <div className="divide-y divide-[#1B2430]">
                {Object.entries(entity.details).map(([label, value]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-x-4 gap-y-1.5 py-2.5"
                  >
                    <div className="whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.08em] text-[#657180]">
                      {label}
                    </div>

                    <div className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-[10px] text-[#C7CDD6]">
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {entity.technique && (
              <div className="mt-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#7C6CFF]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                    ATT&CK
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => focusMitreTechnique(entity.technique ?? "T1003.001")}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                    focusedMitreTechnique === entity.technique
                      ? "border-[#4DD7E8]/30 bg-[#4DD7E8]/[0.045]"
                      : "border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.045] hover:border-[#7C6CFF]/35 hover:bg-[#7C6CFF]/[0.07]"
                  }`}
                >
                  <div>
                    <div className="font-mono text-[10px] font-semibold text-[#8B82FF]">
                      {entity.technique}
                    </div>

                    <div className="mt-0.5 text-[8px] text-[#69727E]">
                      Credential Access
                    </div>
                  </div>

                  <ArrowUpRight className="h-3.5 w-3.5 text-[#7C6CFF]" />
                </button>
              </div>
            )}

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#35D6FF]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                  Relationships
                </span>
              </div>

              <div className="divide-y divide-[#1B2430]">
                {[
                  ["User", "j.smith"],
                  ["Endpoint", "WIN-10-23-17"],
                  ["Network", "185.199.109.153"],
                ].map(([label, value]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const matchingEvent =
                        label === "Network"
                          ? events.find((event) => event.source === "NETWORK")
                          : label === "Endpoint"
                            ? events.find(
                                (event) =>
                                  (event.entity.details.Host ?? "") === value,
                              )
                            : events.find(
                                (event) =>
                                  (event.entity.details.User ?? "") === value,
                              );

                      if (matchingEvent) {
                        setSelectedId(matchingEvent.id);
                      }
                    }}
                    className="flex w-full items-center justify-between border border-transparent px-1 py-2.5 text-left transition hover:border-[#263441] hover:bg-white/[0.018]"
                  >
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.08em] text-[#59616D]">
                        {label}
                      </div>
                      <div className="mt-0.5 font-mono text-[9px] text-[#C7CDD6]">
                        {value}
                      </div>
                    </div>

                    <ChevronRight className="h-3 w-3 text-[#59616D]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#35D6FF]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                  Related IOCs
                </span>
              </div>

              <div className="space-y-1">
                {iocs.map(([value, verdict, risk]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      const artifact = investigationArtifacts.find(
                        (item) =>
                          item.type === "ioc" &&
                          item.value === value,
                      );

                      if (artifact?.sourceEventId) {
                        setSelectedId(artifact.sourceEventId);

                        window.requestAnimationFrame(() => {
                          document
                            .getElementById(
                              `timeline-event-${artifact.sourceEventId}`,
                            )
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "nearest",
                            });
                        });
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-1 py-2 text-left transition hover:border-[#1B2430] hover:bg-white/[0.018]"
                  >
                    <Link2 className="h-3 w-3 shrink-0 text-[#35D6FF]" />

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[8px] text-[#D9DEE7]">
                        {value}
                      </div>

                      <div className="mt-0.5 text-[9px] text-[#59616D]">
                        {verdict}
                      </div>
                    </div>

                    <span className="text-[8px] font-semibold text-[#FF5364]">
                      {risk}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </aside>
      </div>

      <div className="bg-[#080D12]">
        <div className="px-5 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-2 lg:w-[165px]">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05]">
              <ShieldAlert className="h-3.5 w-3.5 text-[#FF5364]" />
            </div>

            <div>
              <div className="text-[11px] font-semibold text-[#F5F7FA]">
                Response
              </div>

              <div className="mt-1 text-[10px] text-[#66717D]">
                Controlled containment actions
              </div>

              <button
                type="button"
                onClick={() => setPlaybookOpen(true)}
                disabled={playbookRunning}
                className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#7C6CFF]/25 bg-[#7C6CFF]/[0.06] px-2.5 py-1.5 text-[8px] font-medium text-[#B8B1FF] transition hover:border-[#7C6CFF]/45 hover:bg-[#7C6CFF]/[0.1] disabled:cursor-wait disabled:opacity-60"
              >
                <ShieldCheck className="h-3 w-3" />
                {playbookRunning ? "Playbook Running" : "Run Playbook"}
              </button>
            </div>
          </div>

          <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {responseActions.map(([name, detail]) => {
              const status = actionState[name] ?? "idle";
              const dangerous = name === "Block IOC";

              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => executeAction(name)}
                  className={`group flex min-h-[54px] items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition ${
                    status === "done"
                      ? "border-[#35D6A1]/25 bg-[#35D6A1]/[0.05]"
                      : status === "running"
                        ? "border-[#F2B84B]/25 bg-[#F2B84B]/[0.04]"
                        : dangerous
                          ? "border-[#FF5364]/15 bg-[#FF5364]/[0.025] hover:border-[#FF5364]/30 hover:bg-[#FF5364]/[0.05]"
                          : "border-[#263441] bg-[#101720] hover:border-[#35D6FF]/20 hover:bg-[#17212B]"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      status === "done"
                        ? "bg-[#35D6A1]/[0.08] text-[#35D6A1]"
                        : dangerous
                          ? "bg-[#FF5364]/[0.06] text-[#FF5364]"
                          : "bg-[#35D6FF]/[0.06] text-[#35D6FF]"
                    }`}
                  >
                    {status === "done" ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </motion.div>
                    ) : status === "running" ? (
                      <Shield className="h-3.5 w-3.5" />
                    ) : (
                      <Shield className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium text-[#D7DDE5]">
                      {name}
                    </div>

                    <div className="mt-1 truncate text-[10px] text-[#66717D]">
                      {detail}
                    </div>
                  </div>

                  <span
                    className={`shrink-0 text-[9px] font-medium uppercase tracking-[0.08em] ${
                      status === "done"
                        ? "text-[#35D6A1]"
                        : status === "running"
                          ? "text-[#FFB84D]"
                          : "text-[#59616D]"
                    }`}
                  >
                    {status === "done"
                      ? "Done"
                      : status === "running"
                        ? "Running"
                        : "Ready"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-2 pl-0 text-[8px] text-[#4F5660] lg:pl-[165px]">
          Actions require confirmation and are recorded in the investigation audit trail.
        </div>
      </div>

      {selectedResponseAction && (
        <ConfirmActionDialog
          open={Boolean(confirmAction)}
          actionName={selectedResponseAction[0]}
          target={
            selectedResponseAction[0] === "Isolate Host"
              ? "WIN-10-23-17"
              : selectedResponseAction[0] === "Disable Account"
                ? "j.smith"
                : selectedResponseAction[0] === "Block IOC"
                  ? "185.199.109.153"
                  : "WIN-10-23-17"
          }
          description={
            selectedResponseAction[0] === "Isolate Host"
              ? "Network containment will isolate the affected endpoint from the environment."
              : selectedResponseAction[0] === "Disable Account"
                ? "The compromised user account will be suspended to prevent further authentication."
                : selectedResponseAction[0] === "Block IOC"
                  ? "The selected indicator will be blocked through firewall and endpoint controls."
                  : "A forensic memory image will be acquired from the affected endpoint."
          }
          state={
            actionState[selectedResponseAction[0]] === "running"
              ? "running"
              : actionState[selectedResponseAction[0]] === "done"
                ? "success"
                : "confirm"
          }
          onConfirm={confirmResponseAction}
          onClose={() => {
            if (actionState[selectedResponseAction[0]] !== "running") {
              setConfirmAction(null);
            }
          }}
        />
      )}

          <EvidencePreviewDrawer
        evidence={evidencePreview}
        onClose={() => setSelectedEvidenceName(null)}
      />

      <PlaybookDrawer
        open={playbookOpen}
        name="Credential Theft Containment"
        description="Automated containment sequence for the active credential-theft investigation."
        steps={playbookSteps}
        running={playbookRunning}
        completed={playbookCompleted}
        onStart={async () => {
          if (!caseContext?.caseId) {
            setFindingValidationError(
              "Playbook cannot start without an active case.",
            );
            return;
          }

          try {
            setFindingValidationError(null);
            setPlaybookRunning(true);
            setPlaybookCompleted(false);

            const createResponse = await fetch(
              `/api/cases/${encodeURIComponent(caseContext.caseId)}/playbooks`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: "Credential Theft Containment",
                  description:
                    "Automated containment sequence for the active credential-theft investigation.",
                  steps: playbookSteps.map((step) => ({
                    id: step.id,
                    title: step.title,
                    description: step.description,
                  })),
                }),
              },
            );

            const createData = (await createResponse.json()) as {
              run?: { id: string };
              error?: string;
            };

            if (!createResponse.ok || !createData.run?.id) {
              throw new Error(
                createData.error ?? "Unable to start playbook.",
              );
            }

            const runId = createData.run.id;

            const runUrl =
              `/api/cases/${encodeURIComponent(caseContext.caseId)}/playbooks/${encodeURIComponent(runId)}`;

            const runningResponse = await fetch(runUrl, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "running",
              }),
            });

            if (!runningResponse.ok) {
              throw new Error("Unable to mark playbook as running.");
            }

            for (const step of playbookSteps) {
              const stepResponse = await fetch(runUrl, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  stepId: step.id,
                  stepStatus: "completed",
                }),
              });

              if (!stepResponse.ok) {
                throw new Error(
                  `Unable to complete playbook step: ${step.title}.`,
                );
              }
            }

            const completedResponse = await fetch(runUrl, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                status: "completed",
              }),
            });

            const completedData = (await completedResponse.json()) as {
              error?: string;
            };

            if (!completedResponse.ok) {
              throw new Error(
                completedData.error ??
                  "Unable to complete playbook.",
              );
            }

            await recordFindingActivity({
              action: "playbook_completed",
              field: "playbook_status",
              oldValue: "running",
              newValue: "completed",
              detail:
                "Credential Theft Containment completed successfully.",
            });

            setPlaybookRunning(false);
            setPlaybookCompleted(true);
          } catch (error) {
            setPlaybookRunning(false);
            setPlaybookCompleted(false);
            setFindingValidationError(
              error instanceof Error
                ? error.message
                : "Unable to execute playbook.",
            );
          }
        }}
        onClose={() => setPlaybookOpen(false)}
      />

      <FindingBuilder
        open={findingBuilderOpen}
        evidence={evidence.map(([name, type, collected, size]) => ({
          name,
          type,
          collected,
          size,
        }))}
        entities={[
          {
            name: entity?.name ?? "Unknown",
            type: entity?.type ?? "Unknown",
            risk: entity?.risk ?? 0,
          },
          ...(caseContext?.endpoint && caseContext.endpoint !== entity?.name
            ? [
                {
                  name: caseContext.endpoint,
                  type: "Endpoint",
                  risk: 50,
                },
              ]
            : []),
        ]}
        onClose={() => setFindingBuilderOpen(false)}
        onSave={async (finding) => {
          if (!caseContext?.caseId) {
            setFindingValidationError(
              "Finding cannot be saved without a case.",
            );
            return;
          }

          try {
            const response = await fetch(
              `/api/cases/${encodeURIComponent(caseContext.caseId)}/findings`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  title: finding.title,
                  description: finding.description,
                  severity: finding.severity,
                  confidence: finding.confidence,
                  technique: finding.technique ?? "",
                  evidenceIds: finding.evidence,
                  entityIds: finding.entities,
                  eventIds: selectedEvent ? [selectedEvent.id] : [],
                  status: "draft",
                  author: "Anshuman Pandey",
                }),
              },
            );

            const data = (await response.json()) as {
              finding?: {
                id?: string;
              };
              error?: string;
            };

            if (!response.ok) {
              throw new Error(
                data.error ?? "Unable to save finding.",
              );
            }

            await recordFindingActivity({
              action: "finding_created",
              field: "finding_status",
              oldValue: "none",
              newValue: "draft",
              detail: `${finding.title} was saved as a draft.`,
            });

            setDraftFinding(finding);
            setFindingStatus("draft");
            setFindingValidationError(null);

            setFindingAuditEvents([
              {
                id: `finding-created-${Date.now()}`,
                label: "Finding created",
                detail: `${finding.title} was saved as a draft.`,
                time: new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                tone: "info",
              },
            ]);

            setFindingBuilderOpen(false);
          } catch (error) {
            setFindingValidationError(
              error instanceof Error
                ? error.message
                : "Unable to save finding.",
            );
          }
        }}
      />
      </div>
    </section>
  );
}
