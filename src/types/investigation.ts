import type { Severity, InvestigationCase } from "./incident";

export type EntityType =
  | "User"
  | "Endpoint"
  | "Process"
  | "File"
  | "IP Address"
  | "Domain"
  | "URL"
  | "Hash"
  | "Registry"
  | "Service"
  | "Unknown";

export type EntityVerdict =
  | "malicious"
  | "suspicious"
  | "benign"
  | "unknown";

export interface InvestigationEventEntity {
  name: string;
  type: EntityType | string;
  verdict: EntityVerdict;
  risk: number;
  technique?: string;
  details: Record<string, string>;
}

export interface InvestigationEvent {
  id: string;
  caseId?: string;
  sourceAlertId?: string;
  time: string;
  timestamp?: string;
  title: string;
  description: string;
  source: string;
  severity: Severity;
  ruleId?: string;
  ruleLevel?: number;
  eventId?: string;
  entity: InvestigationEventEntity;
}

export type IOCType =
  | "ipv4"
  | "ipv6"
  | "domain"
  | "url"
  | "md5"
  | "sha1"
  | "sha256"
  | "email"
  | "file-path"
  | "registry"
  | "unknown";

export interface InvestigationIOC {
  id: string;
  caseId: string;
  value: string;
  type: IOCType;
  reputation?: number;
  confidence?: number;
  sourceEventIds: string[];
  firstSeen?: string;
  lastSeen?: string;
}

export type EvidenceStatus =
  | "requested"
  | "collected"
  | "validated"
  | "analyzed"
  | "archived";

export interface InvestigationEvidence {
  id: string;
  caseId: string;
  name: string;
  type: string;
  source: string;
  status: EvidenceStatus;
  size?: string;
  hash?: string;
  collectedAt?: string;
  collector?: string;
  relatedEventIds: string[];
  relatedEntityIds: string[];
}

export type FindingStatus = "draft" | "review" | "confirmed";

export interface InvestigationFinding {
  id: string;
  caseId: string;
  title: string;
  description: string;
  severity: Severity;
  confidence: string;
  technique?: string;
  evidenceIds: string[];
  entityIds: string[];
  eventIds: string[];
  status: FindingStatus;
  author?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuditTone = "info" | "success" | "warning" | "error";

export interface InvestigationAuditEvent {
  id: string;
  caseId: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  tone: AuditTone;
}

export type ResponseActionStatus =
  | "requested"
  | "approved"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface InvestigationResponseAction {
  id: string;
  caseId: string;
  name: string;
  target: string;
  description: string;
  status: ResponseActionStatus;
  requestedAt: string;
  completedAt?: string;
  error?: string;
}

export type PlaybookRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export interface PlaybookRun {
  id: string;
  caseId: string;
  playbookId: string;
  playbookName: string;
  status: PlaybookRunStatus;
  startedAt?: string;
  completedAt?: string;
  currentStep?: string;
  error?: string;
}

export interface InvestigationContext {
  case: InvestigationCase;
  events: InvestigationEvent[];
  entities: InvestigationEventEntity[];
  iocs: InvestigationIOC[];
  evidence: InvestigationEvidence[];
  findings: InvestigationFinding[];
  auditEvents: InvestigationAuditEvent[];
  responseActions: InvestigationResponseAction[];
  playbookRuns: PlaybookRun[];
}
