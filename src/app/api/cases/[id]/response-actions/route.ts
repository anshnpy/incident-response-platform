import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
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

function mapAction(row: ResponseActionRow) {
  return {
    id: row.id,
    caseId: row.case_id,
    name: row.name,
    target: row.target,
    description: row.description,
    status: row.status,
    requestedAt: row.requested_at,
    completedAt: row.completed_at ?? undefined,
    error: row.error ?? undefined,
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
          name,
          target,
          description,
          status,
          requested_at,
          completed_at,
          error
        FROM response_actions
        WHERE case_id = ?
        ORDER BY requested_at DESC`,
      )
      .bind(caseId)
      .all<ResponseActionRow>();

    return NextResponse.json({
      actions: (result.results ?? []).map(mapAction),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load response actions.",
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
      name?: unknown;
      target?: unknown;
      description?: unknown;
    };

    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      typeof body.target !== "string" ||
      !body.target.trim() ||
      typeof body.description !== "string" ||
      !body.description.trim()
    ) {
      return NextResponse.json(
        { error: "Name, target, and description are required." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const actionId = crypto.randomUUID();

    await env.DB
      .prepare(
        `INSERT INTO response_actions (
          id,
          case_id,
          name,
          target,
          description,
          status,
          requested_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        actionId,
        caseId,
        body.name.trim(),
        body.target.trim(),
        body.description.trim(),
        "requested",
        now,
      )
      .run();

    return NextResponse.json(
      {
        action: {
          id: actionId,
          caseId,
          name: body.name.trim(),
          target: body.target.trim(),
          description: body.description.trim(),
          status: "requested",
          requestedAt: now,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create response action.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
