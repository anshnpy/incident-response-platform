import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
    actionId: string;
  }>;
}

const validStatuses = new Set([
  "requested",
  "approved",
  "running",
  "succeeded",
  "failed",
  "cancelled",
]);


const validActions = new Set([
  "Isolate Host",
  "Disable Account",
  "Block IOC",
  "Collect Memory",
]);

function validateExecutionTarget(
  name: string,
  target: string,
): string | null {
  if (!validActions.has(name)) {
    return "Unsupported response action.";
  }

  const normalized = target.trim();

  if (!normalized) {
    return "Response action target is required.";
  }

  if (name === "Isolate Host") {
    if (
      !/^[A-Za-z0-9._-]+$/.test(normalized) ||
      normalized.toLowerCase() === "unknown endpoint"
    ) {
      return "Invalid endpoint target.";
    }
  }

  if (name === "Disable Account") {
    if (
      !/^[A-Za-z0-9._@-]+$/.test(normalized) ||
      normalized.toLowerCase() === "unknown account"
    ) {
      return "Invalid account target.";
    }
  }

  if (name === "Block IOC") {
    const validIp =
      /^(?:\\d{1,3}\\.){3}\\d{1,3}$/.test(normalized);

    const validHash = /^[A-Fa-f0-9]{64}$/.test(normalized);

    if (!validIp && !validHash) {
      return "IOC target must be an IPv4 address or SHA-256 hash.";
    }
  }

  if (name === "Collect Memory") {
    if (normalized.toLowerCase() === "unknown endpoint") {
      return "Invalid endpoint target.";
    }
  }

  return null;
}

async function executeResponseAction(
  name: string,
  target: string,
): Promise<{ ok: true; result: string } | { ok: false; error: string }> {
  const validationError = validateExecutionTarget(name, target);

  if (validationError) {
    return {
      ok: false,
      error: validationError,
    };
  }

  /*
   * Safe execution boundary:
   * this layer validates the requested action and target,
   * but intentionally does not perform destructive operations.
   * A real EDR/firewall/IAM adapter can be connected here later.
   */
  return {
    ok: true,
    result: `${name} execution validated for ${target}.`,
  };
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId, actionId } = await params;

    const body = (await request.json()) as {
      status?: unknown;
      error?: unknown;
    };

    if (
      typeof body.status !== "string" ||
      !validStatuses.has(body.status)
    ) {
      return NextResponse.json(
        { error: "Invalid response action status." },
        { status: 400 },
      );
    }

    const existingAction = await env.DB
      .prepare(
        `SELECT
          id,
          name,
          target,
          status
        FROM response_actions
        WHERE case_id = ? AND id = ?
        LIMIT 1`,
      )
      .bind(caseId, actionId)
      .first<{
        id: string;
        name: string;
        target: string;
        status: string;
      }>();

    if (!existingAction) {
      return NextResponse.json(
        { error: "Response action not found." },
        { status: 404 },
      );
    }

    if (
      body.status === "running" ||
      body.status === "succeeded"
    ) {
      const execution = await executeResponseAction(
        existingAction.name,
        existingAction.target,
      );

      if (!execution.ok) {
        const failedAt = new Date().toISOString();

        await env.DB
          .prepare(
            `UPDATE response_actions
             SET status = 'failed',
                 completed_at = ?,
                 error = ?
             WHERE case_id = ? AND id = ?`,
          )
          .bind(
            failedAt,
            execution.error,
            caseId,
            actionId,
          )
          .run();

        return NextResponse.json(
          {
            error: execution.error,
            action: {
              id: actionId,
              status: "failed",
              completedAt: failedAt,
              error: execution.error,
            },
          },
          { status: 422 },
        );
      }
    }

    if (body.status === "succeeded") {
      const now = new Date().toISOString();

      await env.DB
        .prepare(
          `UPDATE cases
           SET status = ?,
               phase = ?,
               updated_at = ?
           WHERE id = ?`,
        )
        .bind(
          "contained",
          "Containment",
          now,
          caseId,
        )
        .run();

      const incident = await env.DB
        .prepare(
          `SELECT source_incident_id
           FROM cases
           WHERE id = ?
           LIMIT 1`,
        )
        .bind(caseId)
        .first<{ source_incident_id: string | null }>();

      if (incident?.source_incident_id) {
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
            incident.source_incident_id,
            "Anshuman Pandey",
            "response_completed",
            "case_status",
            "investigating",
            "contained",
            `${existingAction.name} completed successfully against ${existingAction.target}. Case moved to containment.`,
            now,
          )
          .run();
      }
    }

    const completedAt =
      body.status === "succeeded" ||
      body.status === "failed" ||
      body.status === "cancelled"
        ? new Date().toISOString()
        : null;

    const result = await env.DB
      .prepare(
        `UPDATE response_actions
         SET status = ?,
             completed_at = ?,
             error = ?
         WHERE case_id = ? AND id = ?`,
      )
      .bind(
        body.status,
        completedAt,
        typeof body.error === "string" ? body.error : null,
        caseId,
        actionId,
      )
      .run();

    if (!result.meta.changes) {
      return NextResponse.json(
        { error: "Response action not found." },
        { status: 404 },
      );
    }

    const updated = await env.DB
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
      .first();

    return NextResponse.json({ action: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update response action.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
