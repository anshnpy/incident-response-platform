import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

function mapCase(row: Record<string, unknown>) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    severity: row.severity,
    status: row.status,
    phase: row.phase,
    owner: row.owner,
    affectedUser: row.affectedUser ?? null,
    affectedEndpoint: row.affectedEndpoint ?? null,
    riskScore: row.riskScore ?? 0,
    startedAt: row.startedAt,
    updatedAt: row.updatedAt,
    sourceIncidentId: row.sourceIncidentId ?? null,
    sourceIp: row.sourceIp ?? null,
    technique: row.technique ?? null,
    occurrences: row.occurrences ?? 0,
    createdAt: row.createdAt ?? null,
    createdBy: row.createdBy ?? null,
  };
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id } = await params;

    const result = await env.DB
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
        WHERE id = ?
        LIMIT 1`,
      )
      .bind(id)
      .first();

    if (!result) {
      return NextResponse.json(
        {
          error: "Case not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      case: mapCase(result as Record<string, unknown>),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load case.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id } = await params;

    const body = (await request.json()) as Record<string, unknown>;

    const existing = await env.DB
      .prepare(
        `SELECT id, status, source_incident_id
         FROM cases
         WHERE id = ?
         LIMIT 1`,
      )
      .bind(id)
      .first();

    if (!existing) {
      return NextResponse.json(
        {
          error: "Case not found.",
        },
        { status: 404 },
      );
    }

    const existingCase = existing as {
      id: string;
      status: string;
      source_incident_id?: string | null;
    };

    const previousStatus = existingCase.status;

    const allowedTransitions: Record<string, string[]> = {
      detected: ["triage"],
      triage: ["investigating"],
      investigating: ["confirmed"],
      confirmed: ["contained"],
      contained: ["eradication"],
      eradication: ["recovery"],
      recovery: ["closed"],
      closed: [],
    };

    if (
      typeof body.status === "string" &&
      body.status !== previousStatus
    ) {
      const allowedNextStatuses = allowedTransitions[previousStatus] ?? [];

      if (!allowedNextStatuses.includes(body.status)) {
        return NextResponse.json(
          {
            error: `Invalid case status transition: ${previousStatus} -> ${body.status}.`,
          },
          { status: 400 },
        );
      }
    }

    const allowedFields: Record<string, string> = {
      title: "title",
      description: "description",
      severity: "severity",
      status: "status",
      phase: "phase",
      owner: "owner",
      affectedUser: "affected_user",
      affectedEndpoint: "affected_endpoint",
      riskScore: "risk_score",
      startedAt: "started_at",
      updatedAt: "updated_at",
      sourceIncidentId: "source_incident_id",
      sourceIp: "source_ip",
      technique: "technique",
      occurrences: "occurrences",
    };

    const updates: string[] = [];
    const values: unknown[] = [];

    for (const [key, column] of Object.entries(allowedFields)) {
      if (!(key in body)) {
        continue;
      }

      updates.push(`${column} = ?`);
      values.push(body[key] ?? null);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          error: "No supported fields provided.",
        },
        { status: 400 },
      );
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());

    values.push(id);

    await env.DB
      .prepare(
        `UPDATE cases
         SET ${updates.join(", ")}
         WHERE id = ?`,
      )
      .bind(...values)
      .run();

    if (
      typeof body.status === "string" &&
      body.status !== previousStatus &&
      typeof existingCase.source_incident_id === "string" &&
      existingCase.source_incident_id
    ) {
      await env.DB
        .prepare(
          `INSERT INTO incident_activity (
            id,
            incident_id,
            actor,
            action,
            field,
            old_value,
            new_value,
            detail,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          existingCase.source_incident_id,
          "SOC Analyst",
          "case_status_changed",
          "case_status",
          previousStatus,
          body.status,
          `Case ${id} moved from ${previousStatus} to ${body.status}.`,
          new Date().toISOString(),
        )
        .run();
    }

    const updated = await env.DB
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
        WHERE id = ?
        LIMIT 1`,
      )
      .bind(id)
      .first();

    return NextResponse.json({
      case: mapCase(updated as Record<string, unknown>),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update case.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
