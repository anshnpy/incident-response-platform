export type Severity = "critical" | "high" | "medium" | "low";

export type IncidentStatus =
  | "detected"
  | "triage"
  | "investigating"
  | "confirmed"
  | "contained"
  | "eradication"
  | "recovery"
  | "closed";

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  phase: string;
  owner: string;
  affectedUser: string;
  affectedEndpoint: string;
  riskScore: number;
  startedAt: string;
  updatedAt: string;
}


export interface InvestigationCase {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
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
