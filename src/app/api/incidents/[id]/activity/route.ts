import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface IncidentActivityRow {
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

function mapActivity(row: IncidentActivityRow) {
  return {
    id: row.id,
    incidentId: row.incident_id,
    actor: row.actor,
    action: row.action,
    field: row.field,
    oldValue: row.old_value,
    newValue: row.new_value,
    detail: row.detail,
    createdAt: row.created_at,
  };
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
          incident_id,
          actor,
          action,
          field,
          old_value,
          new_value,
          detail,
          created_at
        FROM incident_activity
        WHERE incident_id = ?
        ORDER BY created_at DESC`,
      )
      .bind(id)
      .all<IncidentActivityRow>();

    return NextResponse.json({
      activity: (result.results ?? []).map(mapActivity),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load incident activity.",
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
    const { id: incidentId } = await params;

    const body = (await request.json()) as {
      actor?: unknown;
      action?: unknown;
      field?: unknown;
      oldValue?: unknown;
      newValue?: unknown;
      detail?: unknown;
    };

    if (
      typeof body.actor !== "string" ||
      !body.actor.trim() ||
      typeof body.action !== "string" ||
      !body.action.trim()
    ) {
      return NextResponse.json(
        { error: "Actor and action are required." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const activityId = crypto.randomUUID();

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
        activityId,
        incidentId,
        body.actor.trim(),
        body.action.trim(),
        typeof body.field === "string" ? body.field : null,
        typeof body.oldValue === "string" ? body.oldValue : null,
        typeof body.newValue === "string" ? body.newValue : null,
        typeof body.detail === "string" ? body.detail : null,
        now,
      )
      .run();

    return NextResponse.json(
      {
        activity: {
          id: activityId,
          incidentId,
          actor: body.actor.trim(),
          action: body.action.trim(),
          field: typeof body.field === "string" ? body.field : null,
          oldValue:
            typeof body.oldValue === "string" ? body.oldValue : null,
          newValue:
            typeof body.newValue === "string" ? body.newValue : null,
          detail:
            typeof body.detail === "string" ? body.detail : null,
          createdAt: now,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to record incident activity.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

