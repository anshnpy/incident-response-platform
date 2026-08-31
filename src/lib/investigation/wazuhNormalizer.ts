import type { InvestigationEvent } from "@/types/investigation";

export interface WazuhAlert {
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


function firstValue(value?: string[] | string) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function severityFromLevel(
  level?: number,
): InvestigationEvent["severity"] {
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

function extractSha256(hashes?: string): string | undefined {
  if (!hashes) {
    return undefined;
  }

  const match = hashes.match(/SHA256=([A-Fa-f0-9]{64})/i);
  return match?.[1];
}

function extractIpv4(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const match = value.match(/\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b/);
  return match?.[0];
}

export function extractInvestigationArtifacts(
  alert: WazuhAlert,
  event: InvestigationEvent,
) {
  const source = alert._source;
  const agent = source?.agent;
  const eventdata = source?.data?.win?.eventdata ?? {};
  const timestamp = source?.["@timestamp"] ?? new Date().toISOString();

  const artifacts: Array<{
    type: "evidence" | "ioc";
    value: string;
    category: string;
    hash?: string;
    sourceEventId: string;
    timestamp: string;
  }> = [];

  const sourceEventId = event.id;

  if (eventdata.image) {
    artifacts.push({
      type: "evidence",
      value: eventdata.image,
      category: "Process",
      hash: extractSha256(eventdata.hashes),
      sourceEventId,
      timestamp,
    });
  }

  if (eventdata.commandLine) {
    artifacts.push({
      type: "evidence",
      value: eventdata.commandLine,
      category: "Command Line",
      sourceEventId,
      timestamp,
    });
  }

  if (eventdata.hashes) {
    const sha256 = extractSha256(eventdata.hashes);

    if (sha256) {
      artifacts.push({
        type: "ioc",
        value: sha256,
        category: "SHA-256",
        sourceEventId,
        timestamp,
      });
    }
  }

  const sourceIp = extractIpv4(agent?.ip);

  if (sourceIp) {
    artifacts.push({
      type: "ioc",
      value: sourceIp,
      category: "IPv4",
      sourceEventId,
      timestamp,
    });
  }

  return artifacts;
}

function entityTypeFromEventData(
  eventdata: Record<string, string>,
): string {
  if (eventdata.image) {
    return "Process";
  }

  if (eventdata.targetUserName || eventdata.user) {
    return "User";
  }

  return "Endpoint";
}

export function normalizeWazuhAlert(
  alert: WazuhAlert,
  index = 0,
): InvestigationEvent {
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

  const eventSource =
    source?.decoder?.name === "windows_eventchannel"
      ? "Windows"
      : system?.channel ??
        source?.location ??
        "Wazuh";

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

  if (system?.computer) {
    details.Host = system.computer;
  }

  if (eventdata.user) {
    details.User = eventdata.user;
  }

  if (eventdata.targetUserName) {
    details.TargetUser = eventdata.targetUserName;
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
    sourceAlertId: alert._id ?? source?.id,
    time: timeFromTimestamp(source?.["@timestamp"]),
    timestamp: source?.["@timestamp"],
    title,
    description: compactDescription,
    source: eventSource,
    severity: severityFromLevel(rule?.level),
    ruleId: rule?.id,
    ruleLevel: rule?.level,
    eventId: system?.eventID,
    entity: {
      name: entityName,
      type: entityTypeFromEventData(eventdata),
      verdict: (rule?.level ?? 0) >= 12 ? "malicious" : "suspicious",
      risk: Math.min(
        99,
        Math.max(15, (rule?.level ?? 0) * 7),
      ),
      details,
      ...(technique ? { technique } : {}),
    },
  };
}
