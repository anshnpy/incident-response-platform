"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { CaseLifecycle } from "@/components/ir/CaseLifecycle";
import { ConfirmActionDialog } from "@/components/ir/ConfirmActionDialog";
import { EvidencePreviewDrawer } from "@/components/ir/EvidencePreviewDrawer";
import { FindingBuilder } from "@/components/ir/FindingBuilder";
import { FindingStatusBadge } from "@/components/ir/FindingStatusBadge";
import { FindingAuditTrail } from "@/components/ir/FindingAuditTrail";
import { InvestigationGraph } from "@/components/ir/InvestigationGraph";
import { RiskEngine } from "@/components/ir/RiskEngine";
import { EventCorrelationPanel } from "@/components/ir/EventCorrelationPanel";
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
  Terminal,
  UserRound,
  X,
} from "lucide-react";

type Severity = "critical" | "high" | "medium" | "low";

type EventItem = {
  id: string;
  time: string;
  title: string;
  description: string;
  source: string;
  severity: Severity;
  entity: {
    name: string;
    type: string;
    verdict: "malicious" | "suspicious";
    risk: number;
    details: Record<string, string>;
    technique?: string;
  };
};

const fallbackEvents: EventItem[] = [
  {
    id: "evt-001",
    time: "09:42:11",
    title: "User Login",
    description: "j.smith logged on to WIN-10-23-17",
    source: "Identity",
    severity: "low",
    entity: {
      name: "j.smith",
      type: "User",
      verdict: "suspicious",
      risk: 42,
      details: {
        Account: "j.smith@corp.local",
        Host: "WIN-10-23-17",
        LogonType: "Interactive",
      },
    },
  },
  {
    id: "evt-002",
    time: "09:42:37",
    title: "PowerShell Execution",
    description: "Encoded PowerShell command executed",
    source: "EDR",
    severity: "medium",
    entity: {
      name: "powershell.exe",
      type: "Process",
      verdict: "suspicious",
      risk: 74,
      technique: "T1059.001",
      details: {
        PID: "4248",
        User: "j.smith",
        Host: "WIN-10-23-17",
        Parent: "explorer.exe",
      },
    },
  },
  {
    id: "evt-003",
    time: "09:44:02",
    title: "External Connection",
    description: "Connection to 185.199.109.153:443",
    source: "Network",
    severity: "high",
    entity: {
      name: "185.199.109.153",
      type: "IP Address",
      verdict: "malicious",
      risk: 91,
      details: {
        Protocol: "HTTPS",
        Port: "443",
        Direction: "Outbound",
        Reputation: "Known malicious",
      },
    },
  },
  {
    id: "evt-004",
    time: "09:45:21",
    title: "Credential Dumping",
    description: "mimikatz.exe executed against LSASS",
    source: "EDR",
    severity: "critical",
    entity: {
      name: "mimikatz.exe",
      type: "Process",
      verdict: "malicious",
      risk: 98,
      technique: "T1003.001",
      details: {
        PID: "5124",
        User: "j.smith",
        Host: "WIN-10-23-17",
        Path: "C:\\Users\\j.smith\\Desktop\\mimikatz.exe",
        Parent: "powershell.exe (PID 4248)",
      },
    },
  },
  {
    id: "evt-005",
    time: "09:46:03",
    title: "LSASS Access",
    description: "Process accessed LSASS memory",
    source: "EDR",
    severity: "critical",
    entity: {
      name: "lsass.exe",
      type: "Process",
      verdict: "suspicious",
      risk: 94,
      technique: "T1003",
      details: {
        PID: "648",
        Host: "WIN-10-23-17",
        Operation: "Memory access",
        Timestamp: "09:46:03",
      },
    },
  },
  {
    id: "evt-006",
    time: "09:47:11",
    title: "Lateral Movement",
    description: "SMB connection established to 10.0.5.23",
    source: "Network",
    severity: "high",
    entity: {
      name: "10.0.5.23",
      type: "IP Address",
      verdict: "suspicious",
      risk: 82,
      technique: "T1021.002",
      details: {
        Protocol: "SMB",
        Port: "445",
        Host: "WIN-10-23-17",
        Direction: "Internal",
      },
    },
  },
  {
    id: "evt-007",
    time: "09:51:43",
    title: "Domain Controller Access",
    description: "Privileged authentication observed on DC-01",
    source: "Identity",
    severity: "critical",
    entity: {
      name: "DC-01.corp.local",
      type: "Endpoint",
      verdict: "malicious",
      risk: 96,
      technique: "T1078",
      details: {
        Role: "Domain Controller",
        User: "j.smith",
        Authentication: "Privileged",
        Host: "DC-01.corp.local",
      },
    },
  },
];

const evidence = [
  ["mimikatz.exe", "Process", "09:46:21", "1.24 MB"],
  ["memory_dump.raw", "Memory", "09:47:19", "512 MB"],
  ["LSASS_access.evtx", "Windows Event", "09:46:03", "24 KB"],
  ["auth.log", "Authentication Log", "09:51:43", "19 KB"],
] as const;

const iocs = [
  ["185.199.109.153", "Malicious IP", "91"],
  ["2e4d...a91c", "Malicious Hash", "93"],
  ["bad-traffic.com", "Suspicious Domain", "81"],
] as const;

const responseActions = [
  ["Isolate Host", "Network containment"],
  ["Disable Account", "Identity containment"],
  ["Block IOC", "Firewall / EDR"],
  ["Collect Memory", "Forensic acquisition"],
] as const;

const severityClass = {
  critical: "text-[#FF5364]",
  high: "text-[#FFB84D]",
  medium: "text-[#4F8CFF]",
  low: "text-[#35D6A1]",
} as const;

const severityDot = {
  critical: "bg-[#FF5364]/[0.06] shadow-[0_0_12px_rgba(255,77,90,0.10)]",
  high: "bg-[#FFB84D]",
  medium: "bg-[#4F8CFF]",
  low: "bg-[#35D6A1]",
} as const;

function EventIcon({ event }: { event: EventItem }) {
  if (event.source === "Network") {
    return <Network className="h-4 w-4" />;
  }

  if (event.source === "Identity") {
    return <UserRound className="h-4 w-4" />;
  }

  if (event.title === "LSASS Access") {
    return <ShieldAlert className="h-4 w-4" />;
  }

  if (event.title === "Credential Dumping") {
    return <Terminal className="h-4 w-4" />;
  }

  return <Laptop2 className="h-4 w-4" />;
}


interface WazuhAlert {
  _id?: string;
  _source?: {
    agent?: {
      ip?: string;
      name?: string;
      id?: string;
    };
    rule?: {
      level?: number;
      description?: string;
      id?: string;
      mitre?: {
        technique?: string[] | string;
        id?: string[] | string;
        tactic?: string[] | string;
      };
    };
    data?: {
      win?: {
        eventdata?: Record<string, string>;
        system?: {
          eventID?: string;
          channel?: string;
          providerName?: string;
          computer?: string;
          message?: string;
          severityValue?: string;
        };
      };
    };
    mitre?: {
      technique?: string[] | string;
      id?: string[] | string;
      tactic?: string[] | string;
    };
    decoder?: {
      name?: string;
    };
    location?: string;
    id?: string;
    "@timestamp"?: string;
  };
}

interface WazuhAlertsResponse {
  hits?: {
    hits?: WazuhAlert[];
  };
}

function firstValue(value?: string[] | string) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function severityFromLevel(level?: number): Severity {
  if (typeof level !== "number") {
    return "low";
  }

  if (level >= 12) {
    return "critical";
  }

  if (level >= 8) {
    return "high";
  }

  if (level >= 5) {
    return "medium";
  }

  return "low";
}

function timeFromTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "--:--:--";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "--:--:--";
  }

  return date.toLocaleTimeString("en-IN", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function normalizeWazuhAlert(
  alert: WazuhAlert,
  index: number,
): EventItem {
  const source = alert._source;
  const rule = source?.rule;
  const agent = source?.agent;
  const system = source?.data?.win?.system;
  const eventdata = source?.data?.win?.eventdata ?? {};

  const technique =
    firstValue(rule?.mitre?.id) ??
    firstValue(source?.mitre?.id);

  const techniqueName =
    firstValue(rule?.mitre?.technique) ??
    firstValue(source?.mitre?.technique);

  const title =
    rule?.description ??
    system?.message?.split("\r\n")[0] ??
    system?.message?.split("\n")[0] ??
    "Wazuh Alert";

  const entityName =
    eventdata.image ??
    eventdata.targetUserName ??
    eventdata.user ??
    agent?.name ??
    "Unknown";

  const entityType =
    eventdata.image
      ? "Process"
      : eventdata.targetUserName
        ? "User"
        : "Endpoint";

  const eventSource =
    source?.decoder?.name === "windows_eventchannel"
      ? "Windows"
      : system?.channel ?? source?.location ?? "Wazuh";

  const details: Record<string, string> = {
    Agent: agent?.name ?? "Unknown",
    SourceIP: agent?.ip ?? "Unknown",
    Rule: rule?.id ?? "Unknown",
    RuleLevel: String(rule?.level ?? 0),
    EventID: system?.eventID ?? "Unknown",
  };

  if (system?.channel) {
    details.Channel = system.channel;
  }

  if (techniqueName) {
    details.Technique = techniqueName;
  }

  if (eventdata.image) {
    details.Image = eventdata.image;
  }

  if (eventdata.commandLine) {
    details.CommandLine = eventdata.commandLine;
  }

  if (eventdata.hashes) {
    details.Hashes = eventdata.hashes;
  }

  if (eventdata.targetUserName) {
    details.TargetUser = eventdata.targetUserName;
  }

  const compactDescription =
    rule?.description ??
    (eventdata.image
      ? `${eventdata.image} observed on ${agent?.name ?? "endpoint"}.`
      : eventdata.targetUserName
        ? `Activity involving ${eventdata.targetUserName} detected on ${agent?.name ?? "endpoint"}.`
        : system?.eventID
          ? `Windows event ${system.eventID} detected on ${agent?.name ?? "endpoint"}.`
          : `${title} detected by Wazuh.`);

  return {
    id: alert._id ?? source?.id ?? `wazuh-${index}`,
    time: timeFromTimestamp(source?.["@timestamp"]),
    title,
    description: compactDescription,
    source: eventSource,
    severity: severityFromLevel(rule?.level),
    entity: {
      name: entityName,
      type: entityType,
      verdict: (rule?.level ?? 0) >= 8 ? "suspicious" : "suspicious",
      risk: Math.min(99, Math.max(15, (rule?.level ?? 0) * 7)),
      details,
      ...(technique ? { technique } : {}),
    },
  };
}

interface InvestigationWorkspaceProps {
  initialEventId?: string;
  caseContext?: {
    caseId?: string;
    sourceIp?: string;
    endpoint?: string;
    technique?: string | null;
    title?: string;
    firstSeen?: string;
    lastSeen?: string;
  };
}

export function InvestigationWorkspace({
  initialEventId = "evt-004",
  caseContext,
}: InvestigationWorkspaceProps) {
  const [liveEvents, setLiveEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    let cancelled = false;

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

        const scored = alerts.map((alert, index) => {
          const source = alert._source;
          const agent = source?.agent;
          const system = source?.data?.win?.system;
          const eventdata = source?.data?.win?.eventdata ?? {};
          const rule = source?.rule;

          const endpoint = caseContext?.endpoint?.toLowerCase();
          const sourceIp = caseContext?.sourceIp?.toLowerCase();
          const technique = caseContext?.technique?.toLowerCase();
          const title = caseContext?.title?.toLowerCase() ?? "";

          const agentName = agent?.name?.toLowerCase() ?? "";
          const agentIp = agent?.ip?.toLowerCase() ?? "";
          const computer = system?.computer?.toLowerCase() ?? "";

          const ruleDescription =
            rule?.description?.toLowerCase() ?? "";

          const image =
            eventdata.image?.toLowerCase() ?? "";

          const commandLine =
            eventdata.commandLine?.toLowerCase() ?? "";

          const eventMessage =
            system?.message?.toLowerCase() ?? "";

          const fullText = [
            ruleDescription,
            image,
            commandLine,
            eventMessage,
          ].join(" ");

          const ruleTechniques = [
            ...(Array.isArray(rule?.mitre?.technique)
              ? rule.mitre.technique
              : rule?.mitre?.technique
                ? [rule.mitre.technique]
                : []),
            ...(Array.isArray(source?.mitre?.technique)
              ? source.mitre.technique
              : source?.mitre?.technique
                ? [source.mitre.technique]
                : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          const devNoisePatterns = [
            "eslint",
            "next build",
            "npm run",
            "npm exec",
            "node.exe",
            "git config",
            "git.exe",
            "conhost.exe",
            "cmd.exe /d /s /c",
            "windows command processor",
            "windows command shell",
          ];

          const isDevelopmentNoise = devNoisePatterns.some(
            (pattern) => fullText.includes(pattern),
          );

          let score = 0;
          let directCaseMatch = false;

          if (endpoint) {
            if (agentName === endpoint) {
              score += 60;
            }

            if (computer === endpoint) {
              score += 45;
            }

            if (
              agentName.includes(endpoint) ||
              endpoint.includes(agentName)
            ) {
              score += 30;
            }
          }

          if (sourceIp && agentIp === sourceIp) {
            score += 40;
          }

          if (technique && ruleTechniques.includes(technique)) {
            score += 70;
            directCaseMatch = true;
          }

          const titleTokens = title
            .split(/[^a-z0-9.:-]+/)
            .filter((token) => token.length >= 4)
            .filter(
              (token) =>
                !["affects", "affect", "python", "64-bit"].includes(token),
            );

          for (const token of titleTokens) {
            if (fullText.includes(token)) {
              score += 15;
              directCaseMatch = true;
            }
          }

          if (
            caseContext?.sourceIp &&
            fullText.includes(caseContext.sourceIp.toLowerCase())
          ) {
            score += 20;
            directCaseMatch = true;
          }

          if (isDevelopmentNoise && !directCaseMatch) {
            score = 0;
          }

          return {
            alert,
            index,
            score,
            isDevelopmentNoise,
          };
        });

        const relevant = scored
          .filter(
            (item) => item.score >= 30 && !item.isDevelopmentNoise,
          )
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);

        const selected = relevant.length > 0
          ? relevant
          : scored
              .filter((item) => !item.isDevelopmentNoise)
              .sort((a, b) => b.score - a.score)
              .slice(0, 20);

        const normalized = selected.map((item, index) =>
          normalizeWazuhAlert(item.alert, index),
        );

        setLiveEvents(normalized);
      })
      .catch(() => {
        if (!cancelled) {
          setLiveEvents([]);
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
  ]);

  const events = useMemo(
    () => (liveEvents.length > 0 ? liveEvents : fallbackEvents),
    [liveEvents],
  );

  const selectEvent = (id: string) => {
    selectEvent(id);

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
    fallbackEvents[0];

  const entity = selectedEvent.entity;

  const correlatedEvents = events.filter((event) => event.id !== selectedEvent.id).slice(0, 4);

  const selectedEvidence = evidence.find(
    ([name]) => name === selectedEvidenceName,
  );

  const evidencePreview = selectedEvidence
    ? {
        name: selectedEvidence[0],
        type: selectedEvidence[1],
        collected: selectedEvidence[2],
        size: selectedEvidence[3],
        source:
          selectedEvidence[0] === "mimikatz.exe"
            ? "WIN-10-23-17 / EDR"
            : selectedEvidence[0] === "memory_dump.raw"
              ? "WIN-10-23-17"
              : selectedEvidence[0] === "LSASS_access.evtx"
                ? "EDR"
                : "Domain Controller",
        hash:
          selectedEvidence[0] === "mimikatz.exe"
            ? "2e4d0c8fa91c7e31b5e42f6a0b9c1d5...a91c"
            : selectedEvidence[0] === "memory_dump.raw"
              ? "7b2e4a1f9c8d31aa42d8c7e2b6f09e...7a1d"
              : selectedEvidence[0] === "LSASS_access.evtx"
                ? "9b7e1c2d4a5f8e6b0c3d1a9f2e7b...31f"
                : "4c9e8d2a7b1f53d6e4a8c1f9b2d...8e21",
        custody: `Collected at ${selectedEvidence[2]} from ${selectedEvidence[1]}.`,
        relatedEvent: selectedEvent.title,
        relatedEntity: entity.name,
      }
    : null;

  const selectedResponseAction =
    responseActions.find(([name]) => name === confirmAction) ?? null;

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

  const confirmFinding = () => {
    const validationError = validateFinding();

    if (validationError) {
      setFindingValidationError(validationError);
      return;
    }

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

  const submitFindingForReview = () => {
    const validationError = validateFinding();

    if (validationError) {
      setFindingValidationError(validationError);
      return;
    }

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
  };

  const confirmResponseAction = () => {
    if (!confirmAction) return;

    const name = confirmAction;

    setActionState((current) => ({
      ...current,
      [name]: "running",
    }));

    setFindingAuditEvents((current) => [
      ...current,
      {
        id: `response-started-${Date.now()}`,
        label: `${name} started`,
        detail: `Response action initiated from the investigation console.`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        tone: "warning",
      },
    ]);

    window.setTimeout(() => {
      setActionState((current) => ({
        ...current,
        [name]: "done",
      }));

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
    }, 900);
  };

  return (
    <section className="ir-console overflow-hidden rounded-2xl border border-[#263441] bg-[#08090B]">
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
                {events.map((event) => {
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
                })}
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
            <CaseLifecycle />
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
            highlightedTechnique={focusedMitreTechnique}
            onTraceSelect={(title) => {
              const event = events.find((item) => item.title === title);

              if (event) {
                setSelectedId(event.id);
              }
            }}
            selectedNodeId={
              entity.name === "mimikatz.exe"
                ? "malware"
                : entity.name === "j.smith"
                  ? "account"
                  : entity.name === "WIN-10-23-17"
                    ? "endpoint"
                    : undefined
            }
            onSelect={(node) => {
              if (node.id === "malware") {
                const event = events.find(
                  (item) => item.title === "Credential Dumping",
                );

                if (event) {
                  setSelectedId(event.id);
                }
              }

              if (node.id === "attacker-ip" || node.id === "c2") {
                const event = events.find(
                  (item) => item.title === "External Connection",
                );

                if (event) {
                  setSelectedId(event.id);
                }
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
                        onClick={() => {
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
                    {entity.risk}
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
                  {entity.risk >= 90
                    ? "CRITICAL"
                    : entity.risk >= 70
                      ? "HIGH"
                      : entity.risk >= 40
                        ? "MEDIUM"
                        : "LOW"}
                </span>
              </summary>

              <div className="mt-4">
                <RiskEngine
                  score={entity.risk}
                  factors={[
                    {
                      label: "Asset Criticality",
                      value: 25,
                      icon: "asset",
                      reason: "The affected asset has elevated operational importance.",
                    },
                    {
                      label: "IOC Reputation",
                      value: 20,
                      icon: "ioc",
                      reason: "Associated indicators have suspicious or malicious reputation.",
                    },
                    {
                      label: "Privilege Level",
                      value: 15,
                      icon: "privilege",
                      reason: "The investigation contains privileged identity activity.",
                    },
                    {
                      label: "MITRE Techniques",
                      value: 12,
                      icon: "mitre",
                      reason: "Observed behavior maps to credential-access techniques.",
                    },
                    {
                      label: "Lateral Movement",
                      value: 10,
                      icon: "lateral",
                      reason: "Network activity suggests potential movement across hosts.",
                    },
                    {
                      label: "Data Access",
                      value: 5,
                      icon: "data",
                      reason: "Credential and memory artifacts increase investigation impact.",
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
                      const normalizedValue = value.toLowerCase();

                      const exactMatch = events.find((event) => {
                        const searchable = [
                          event.title,
                          event.source,
                          event.entity.name,
                          ...Object.values(event.entity.details),
                        ]
                          .join(" ")
                          .toLowerCase();

                        return searchable.includes(normalizedValue);
                      });

                      const networkEvent =
                        exactMatch ??
                        events.find(
                          (event) =>
                            event.entity.name === value ||
                            /network|connection|external|ip/i.test(
                              `${event.title} ${event.source}`,
                            ),
                        );

                      if (networkEvent) {
                        setSelectedId(networkEvent.id);
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
        onStart={() => {
          setPlaybookRunning(true);

          window.setTimeout(() => {
            setPlaybookRunning(false);
            setPlaybookCompleted(true);
          }, 2200);
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
            name: "mimikatz.exe",
            type: "Process",
            risk: 98,
          },
          {
            name: "j.smith",
            type: "User",
            risk: 74,
          },
          {
            name: "WIN-10-23-17",
            type: "Endpoint",
            risk: 93,
          },
        ]}
        onClose={() => setFindingBuilderOpen(false)}
        onSave={(finding) => {
          setDraftFinding(finding);
          setFindingStatus("draft");
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
        }}
      />
      </div>
    </section>
  );
}
