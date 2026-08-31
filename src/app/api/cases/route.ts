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

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });

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
        ORDER BY updated_at DESC`,
      )
      .all();

    return NextResponse.json({
      cases: (result.results ?? []).map((row) =>
        mapCase(row as Record<string, unknown>),
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load cases.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const body = (await request.json()) as Record<string, unknown>;

    if (
      typeof body.id !== "string" ||
      typeof body.title !== "string" ||
      !body.id.trim() ||
      !body.title.trim()
    ) {
      return NextResponse.json(
        {
          error: "Case id and title are required.",
        },
        { status: 400 },
      );
    }

    const existing = body.sourceIncidentId
      ? await env.DB
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
            WHERE source_incident_id = ?
            ORDER BY created_at ASC
            LIMIT 1`,
          )
          .bind(body.sourceIncidentId)
          .first()
      : null;

    if (existing) {
      return NextResponse.json({
        case: mapCase(existing as Record<string, unknown>),
        alreadyExists: true,
      });
    }

    const now = new Date().toISOString();

    await env.DB
      .prepare(
        `INSERT INTO cases (
          id,
          title,
          description,
          severity,
          status,
          phase,
          owner,
          affected_user,
          affected_endpoint,
          risk_score,
          started_at,
          updated_at,
          source_incident_id,
          source_ip,
          technique,
          occurrences,
          created_at,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        body.id,
        body.title,
        typeof body.description === "string"
          ? body.description
          : null,
        typeof body.severity === "string"
          ? body.severity
          : "low",
        typeof body.status === "string"
          ? body.status
          : "detected",
        typeof body.phase === "string"
          ? body.phase
          : "Detection",
        typeof body.owner === "string"
          ? body.owner
          : "Unassigned",
        typeof body.affectedUser === "string"
          ? body.affectedUser
          : null,
        typeof body.affectedEndpoint === "string"
          ? body.affectedEndpoint
          : null,
        typeof body.riskScore === "number"
          ? body.riskScore
          : 0,
        typeof body.startedAt === "string"
          ? body.startedAt
          : now,
        typeof body.updatedAt === "string"
          ? body.updatedAt
          : now,
        typeof body.sourceIncidentId === "string"
          ? body.sourceIncidentId
          : null,
        typeof body.sourceIp === "string"
          ? body.sourceIp
          : null,
        typeof body.technique === "string"
          ? body.technique
          : null,
        typeof body.occurrences === "number"
          ? body.occurrences
          : 0,
        now,
        typeof body.createdBy === "string"
          ? body.createdBy
          : null,
      )
      .run();

    return NextResponse.json(
      {
        case: {
          ...body,
          createdAt: now,
          updatedAt:
            typeof body.updatedAt === "string"
              ? body.updatedAt
              : now,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create case.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
