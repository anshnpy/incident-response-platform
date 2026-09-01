import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WAZUH_SUMMARY =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/summary";

const WAZUH_INCIDENTS =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/incidents";

interface WazuhSummary {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  endpoints: number;
  topSourceIps: {
    ip: string;
    count: number;
  }[];
  systemHealth: number;
}

interface WazuhIncident {
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

interface ResponseActionRow {
  id: string;
  case_id: string;
  name: string;
  target: string;
  description: string;
  status: string;
  requested_at: string;
  completed_at: string | null;
  error: string | null;
}

interface PlaybookRunRow {
  id: string;
  case_id: string;
  name: string;
  description: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityRow {
  id: string;
  incident_id: string;
  actor: string;
  action: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  detail: string | null;
  created_at: string;
}

function severityWeight(severity: string) {
  const value = severity.toLowerCase();

  if (value === "critical") return 4;
  if (value === "high") return 3;
  if (value === "medium") return 2;

  return 1;
}

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const [summaryResponse, incidentsResponse, casesResult, activityResult, responseResult, playbookResult] =
      await Promise.all([
        fetch(WAZUH_SUMMARY, { cache: "no-store" }),
        fetch(WAZUH_INCIDENTS, { cache: "no-store" }),
        env.DB
          .prepare(
            `SELECT
              id,
              title,
              description,
              severity,
              status,
              phase,
              owner,
              affected_user AS affectedUser,
              affected_endpoint AS affectedEndpoint,
              risk_score AS riskScore,
              started_at AS startedAt,
              updated_at AS updatedAt,
              source_incident_id AS sourceIncidentId,
              source_ip AS sourceIp,
              technique,
              occurrences,
              created_at AS createdAt,
              created_by AS createdBy
            FROM cases
            ORDER BY updated_at DESC
            LIMIT 10`,
          )
          .all(),
        env.DB
          .prepare(
            `SELECT
              id,
              incident_id,
              actor,
              action,
              field,
              old_value,
              new_value,
              detail,
              created_at
            FROM incident_activity
            ORDER BY created_at DESC
            LIMIT 10`,
          )
          .all<ActivityRow>(),
        env.DB
          .prepare(
            `SELECT
              id,
              case_id,
              name,
              target,
              description,
              status,
              requested_at,
              completed_at,
              error
            FROM response_actions
            ORDER BY requested_at DESC
            LIMIT 10`,
          )
          .all<ResponseActionRow>(),
        env.DB
          .prepare(
            `SELECT
              id,
              case_id,
              name,
              description,
              status,
              started_at,
              completed_at,
              created_at,
              updated_at
            FROM playbook_runs
            ORDER BY created_at DESC
            LIMIT 10`,
          )
          .all<PlaybookRunRow>(),
      ]);

    if (!summaryResponse.ok || !incidentsResponse.ok) {
      return NextResponse.json(
        {
          error: "Unable to load live Wazuh dashboard data.",
          wazuhSummaryStatus: summaryResponse.status,
          wazuhIncidentsStatus: incidentsResponse.status,
        },
        { status: 502 },
      );
    }

    const summary =
      (await summaryResponse.json()) as WazuhSummary;

    const incidentsPayload =
      (await incidentsResponse.json()) as {
        incidents?: WazuhIncident[];
      };

    const incidents = [...(incidentsPayload.incidents ?? [])]
      .sort((a, b) => {
        const severityDiff =
          severityWeight(b.severity) -
          severityWeight(a.severity);

        if (severityDiff !== 0) {
          return severityDiff;
        }

        return (
          new Date(b.lastSeen).getTime() -
          new Date(a.lastSeen).getTime()
        );
      })
      .slice(0, 8);

    return NextResponse.json({
      telemetry: summary,
      incidents,
      cases: casesResult.results ?? [],
      activity: activityResult.results ?? [],
      response: responseResult.results ?? [],
      playbooks: playbookResult.results ?? [],
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load dashboard data.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
