import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { executeResponseAction } from "@/lib/investigation/responseAdapters";

interface RouteContext {
  params: Promise<{
    id: string;
    actionId: string;
  }>;
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

export async function POST(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId, actionId } = await params;

    const action = await env.DB
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
        WHERE case_id = ? AND id = ?
        LIMIT 1`,
      )
      .bind(caseId, actionId)
      .first<ResponseActionRow>();

    if (!action) {
      return NextResponse.json(
        { error: "Response action not found." },
        { status: 404 },
      );
    }

    if (
      action.status !== "requested" &&
      action.status !== "approved"
    ) {
      return NextResponse.json(
        {
          error: `Response action cannot be executed from status "${action.status}".`,
        },
        { status: 409 },
      );
    }

    const startedAt = new Date().toISOString();

    await env.DB
      .prepare(
        `UPDATE response_actions
         SET status = ?, completed_at = NULL, error = NULL
         WHERE case_id = ? AND id = ?`,
      )
      .bind("running", caseId, actionId)
      .run();

    const result = await executeResponseAction({
      name: action.name,
      target: action.target,
      description: action.description,
    });

    const completedAt = new Date().toISOString();

    await env.DB
      .prepare(
        `UPDATE response_actions
         SET status = ?, completed_at = ?, error = ?
         WHERE case_id = ? AND id = ?`,
      )
      .bind(
        result.success ? "succeeded" : "failed",
        completedAt,
        result.success ? null : result.message,
        caseId,
        actionId,
      )
      .run();

    return NextResponse.json({
      action: {
        id: action.id,
        caseId: action.case_id,
        name: action.name,
        target: action.target,
        description: action.description,
        status: result.success ? "succeeded" : "failed",
        requestedAt: action.requested_at,
        startedAt,
        completedAt,
        error: result.success ? undefined : result.message,
        provider: result.provider,
        message: result.message,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to execute response action.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
