import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface FindingRow {
  id: string;
  case_id: string;
  title: string;
  description: string;
  severity: string;
  confidence: string;
  technique: string | null;
  evidence_ids: string;
  entity_ids: string;
  event_ids: string;
  status: string;
  author: string | null;
  created_at: string;
  updated_at: string;
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function mapFinding(row: FindingRow) {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    description: row.description,
    severity: row.severity,
    confidence: row.confidence,
    technique: row.technique ?? undefined,
    evidenceIds: parseJsonArray(row.evidence_ids),
    entityIds: parseJsonArray(row.entity_ids),
    eventIds: parseJsonArray(row.event_ids),
    status: row.status,
    author: row.author ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId } = await params;

    const result = await env.DB
      .prepare(
        `SELECT
          id,
          case_id,
          title,
          description,
          severity,
          confidence,
          technique,
          evidence_ids,
          entity_ids,
          event_ids,
          status,
          author,
          created_at,
          updated_at
        FROM findings
        WHERE case_id = ?
        ORDER BY updated_at DESC`,
      )
      .bind(caseId)
      .all<FindingRow>();

    return NextResponse.json({
      findings: (result.results ?? []).map(mapFinding),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load case findings.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId } = await params;

    const body = (await request.json()) as {
      id?: unknown;
      title?: unknown;
      description?: unknown;
      severity?: unknown;
      confidence?: unknown;
      technique?: unknown;
      evidenceIds?: unknown;
      entityIds?: unknown;
      eventIds?: unknown;
      status?: unknown;
      author?: unknown;
    };

    if (
      typeof body.title !== "string" ||
      body.title.trim().length === 0 ||
      typeof body.description !== "string" ||
      body.description.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Finding title and description are required." },
        { status: 400 },
      );
    }

    const arrayFields = [
      ["evidenceIds", body.evidenceIds],
      ["entityIds", body.entityIds],
      ["eventIds", body.eventIds],
    ] as const;

    for (const [name, value] of arrayFields) {
      if (
        value !== undefined &&
        (!Array.isArray(value) ||
          value.some((item) => typeof item !== "string"))
      ) {
        return NextResponse.json(
          { error: `${name} must be an array of strings.` },
          { status: 400 },
        );
      }
    }

    const now = new Date().toISOString();

    const finding = {
      id:
        typeof body.id === "string" && body.id.trim()
          ? body.id
          : `FND-${Date.now()}`,
      title: body.title.trim(),
      description: body.description.trim(),
      severity:
        typeof body.severity === "string" && body.severity.trim()
          ? body.severity
          : "medium",
      confidence:
        typeof body.confidence === "string" && body.confidence.trim()
          ? body.confidence
          : "medium",
      technique:
        typeof body.technique === "string" && body.technique.trim()
          ? body.technique
          : null,
      evidenceIds: Array.isArray(body.evidenceIds) ? body.evidenceIds : [],
      entityIds: Array.isArray(body.entityIds) ? body.entityIds : [],
      eventIds: Array.isArray(body.eventIds) ? body.eventIds : [],
      status:
        typeof body.status === "string" && body.status.trim()
          ? body.status
          : "draft",
      author:
        typeof body.author === "string" && body.author.trim()
          ? body.author
          : null,
    };

    await env.DB
      .prepare(
        `INSERT INTO findings (
          id,
          case_id,
          title,
          description,
          severity,
          confidence,
          technique,
          evidence_ids,
          entity_ids,
          event_ids,
          status,
          author,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        finding.id,
        caseId,
        finding.title,
        finding.description,
        finding.severity,
        finding.confidence,
        finding.technique,
        JSON.stringify(finding.evidenceIds),
        JSON.stringify(finding.entityIds),
        JSON.stringify(finding.eventIds),
        finding.status,
        finding.author,
        now,
        now,
      )
      .run();

    return NextResponse.json(
      {
        finding: {
          ...finding,
          caseId,
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create finding.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
