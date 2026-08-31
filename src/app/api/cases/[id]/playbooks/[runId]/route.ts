import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
    runId: string;
  }>;
}

const validStatuses = new Set([
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
]);

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId, runId } = await params;

    const run = await env.DB
      .prepare(
        `SELECT
          id,
          case_id,
          name,
          description,
          status,
          started_at,
          completed_at,
          error,
          created_at,
          updated_at
        FROM playbook_runs
        WHERE case_id = ? AND id = ?
        LIMIT 1`,
      )
      .bind(caseId, runId)
      .first();

    if (!run) {
      return NextResponse.json(
        { error: "Playbook run not found." },
        { status: 404 },
      );
    }

    const steps = await env.DB
      .prepare(
        `SELECT
          id,
          run_id,
          step_id,
          title,
          description,
          status,
          started_at,
          completed_at,
          error,
          sort_order
        FROM playbook_run_steps
        WHERE run_id = ?
        ORDER BY sort_order ASC`,
      )
      .bind(runId)
      .all();

    return NextResponse.json({
      run,
      steps: steps.results ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load playbook run.",
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
    const { id: caseId, runId } = await params;

    const body = (await request.json()) as {
      status?: unknown;
      stepId?: unknown;
      stepStatus?: unknown;
      error?: unknown;
    };

    if (
      body.status !== undefined &&
      (typeof body.status !== "string" ||
        !validStatuses.has(body.status))
    ) {
      return NextResponse.json(
        { error: "Invalid playbook run status." },
        { status: 400 },
      );
    }

    if (
      body.stepId !== undefined &&
      typeof body.stepId !== "string"
    ) {
      return NextResponse.json(
        { error: "stepId must be a string." },
        { status: 400 },
      );
    }

    if (
      body.stepStatus !== undefined &&
      (typeof body.stepStatus !== "string" ||
        !new Set([
          "pending",
          "running",
          "completed",
          "failed",
          "cancelled",
        ]).has(body.stepStatus))
    ) {
      return NextResponse.json(
        { error: "Invalid playbook step status." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    const run = await env.DB
      .prepare(
        `SELECT id, status
         FROM playbook_runs
         WHERE case_id = ? AND id = ?
         LIMIT 1`,
      )
      .bind(caseId, runId)
      .first<{
        id: string;
        status: string;
      }>();

    if (!run) {
      return NextResponse.json(
        { error: "Playbook run not found." },
        { status: 404 },
      );
    }

    if (body.stepId && body.stepStatus) {
      const stepStartedAt =
        body.stepStatus === "running" ? now : null;

      const stepCompletedAt =
        body.stepStatus === "completed" ||
        body.stepStatus === "failed" ||
        body.stepStatus === "cancelled"
          ? now
          : null;

      const result = await env.DB
        .prepare(
          `UPDATE playbook_run_steps
           SET status = ?,
               started_at = COALESCE(started_at, ?),
               completed_at = ?,
               error = ?
           WHERE run_id = ? AND step_id = ?`,
        )
        .bind(
          body.stepStatus,
          stepStartedAt,
          stepCompletedAt,
          typeof body.error === "string" ? body.error : null,
          runId,
          body.stepId,
        )
        .run();

      if (!result.meta.changes) {
        return NextResponse.json(
          { error: "Playbook step not found." },
          { status: 404 },
        );
      }
    }

    if (body.status) {
      if (body.status === "completed") {
        const stepResult = await env.DB
          .prepare(
            `SELECT COUNT(*) AS total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
             FROM playbook_run_steps
             WHERE run_id = ?`,
          )
          .bind(runId)
          .first<{
            total: number;
            completed: number;
          }>();

        const totalSteps = Number(stepResult?.total ?? 0);
        const completedSteps = Number(stepResult?.completed ?? 0);

        if (totalSteps === 0 || completedSteps !== totalSteps) {
          return NextResponse.json(
            {
              error: "Playbook cannot be completed until all steps are completed.",
              totalSteps,
              completedSteps,
            },
            { status: 409 },
          );
        }
      }

      const startedAt =
        body.status === "running" ? now : null;

      const completedAt =
        body.status === "completed" ||
        body.status === "failed" ||
        body.status === "cancelled"
          ? now
          : null;

      await env.DB
        .prepare(
          `UPDATE playbook_runs
           SET status = ?,
               started_at = COALESCE(started_at, ?),
               completed_at = ?,
               error = ?,
               updated_at = ?
           WHERE case_id = ? AND id = ?`,
        )
        .bind(
          body.status,
          startedAt,
          completedAt,
          typeof body.error === "string" ? body.error : null,
          now,
          caseId,
          runId,
        )
        .run();
    } else {
      await env.DB
        .prepare(
          `UPDATE playbook_runs
           SET updated_at = ?
           WHERE case_id = ? AND id = ?`,
        )
        .bind(now, caseId, runId)
        .run();
    }

    const updatedRun = await env.DB
      .prepare(
        `SELECT
          id,
          case_id,
          name,
          description,
          status,
          started_at,
          completed_at,
          error,
          created_at,
          updated_at
        FROM playbook_runs
        WHERE case_id = ? AND id = ?
        LIMIT 1`,
      )
      .bind(caseId, runId)
      .first();

    return NextResponse.json({
      run: updatedRun,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update playbook run.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
