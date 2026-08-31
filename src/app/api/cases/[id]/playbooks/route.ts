import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface PlaybookStepInput {
  id?: unknown;
  title?: unknown;
  description?: unknown;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId } = await params;

    const runs = await env.DB
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
        WHERE case_id = ?
        ORDER BY updated_at DESC`,
      )
      .bind(caseId)
      .all<{
        id: string;
        case_id: string;
        name: string;
        description: string;
        status: string;
        started_at: string | null;
        completed_at: string | null;
        error: string | null;
        created_at: string;
        updated_at: string;
      }>();

    return NextResponse.json({
      runs: runs.results ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load playbook runs.",
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
      description?: unknown;
      steps?: unknown;
    };

    if (
      typeof body.name !== "string" ||
      !body.name.trim() ||
      typeof body.description !== "string" ||
      !body.description.trim() ||
      !Array.isArray(body.steps) ||
      body.steps.length === 0
    ) {
      return NextResponse.json(
        { error: "Playbook name, description, and steps are required." },
        { status: 400 },
      );
    }

    const steps = body.steps as PlaybookStepInput[];

    if (
      steps.some(
        (step) =>
          typeof step?.id !== "string" ||
          typeof step?.title !== "string" ||
          typeof step?.description !== "string",
      )
    ) {
      return NextResponse.json(
        { error: "Invalid playbook step definition." },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const runId = crypto.randomUUID();

    await env.DB
      .prepare(
        `INSERT INTO playbook_runs (
          id,
          case_id,
          name,
          description,
          status,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        runId,
        caseId,
        body.name.trim(),
        body.description.trim(),
        "queued",
        now,
        now,
      )
      .run();

    for (const [index, step] of steps.entries()) {
      await env.DB
        .prepare(
          `INSERT INTO playbook_run_steps (
            id,
            run_id,
            step_id,
            title,
            description,
            status,
            sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          crypto.randomUUID(),
          runId,
          step.id,
          step.title,
          step.description,
          "pending",
          index,
        )
        .run();
    }

    return NextResponse.json(
      {
        run: {
          id: runId,
          caseId,
          name: body.name.trim(),
          description: body.description.trim(),
          status: "queued",
          createdAt: now,
          updatedAt: now,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to create playbook run.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
