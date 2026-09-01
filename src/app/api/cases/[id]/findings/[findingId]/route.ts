import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{
    id: string;
    findingId: string;
  }>;
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const { id: caseId, findingId } = await params;

    const body = (await request.json()) as {
      status?: unknown;
      title?: unknown;
      description?: unknown;
      severity?: unknown;
      confidence?: unknown;
      technique?: unknown;
      evidenceIds?: unknown;
      entityIds?: unknown;
      eventIds?: unknown;
      author?: unknown;
    };

    const updates: string[] = [];
    const values: unknown[] = [];

    if (body.status !== undefined) {
      if (typeof body.status !== "string") {
        return NextResponse.json(
          { error: "Status must be a string." },
          { status: 400 },
        );
      }

      const nextStatus = body.status.trim().toLowerCase();

      const currentFinding = await env.DB
        .prepare(
          `SELECT status
           FROM findings
           WHERE case_id = ? AND id = ?
           LIMIT 1`,
        )
        .bind(caseId, findingId)
        .first<{ status?: string }>();

      if (!currentFinding?.status) {
        return NextResponse.json(
          { error: "Finding not found." },
          { status: 404 },
        );
      }

      const currentStatus = currentFinding.status.toLowerCase();

      const allowedTransitions: Record<string, string[]> = {
        draft: ["review"],
        review: ["confirmed", "draft"],
        confirmed: ["draft"],
      };

      const allowedNextStatuses =
        allowedTransitions[currentStatus] ?? [];

      if (!allowedNextStatuses.includes(nextStatus)) {
        return NextResponse.json(
          {
            error: `Invalid finding status transition: ${currentStatus} ? ${nextStatus}.`,
          },
          { status: 409 },
        );
      }

      updates.push("status = ?");
      values.push(nextStatus);
    }

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        return NextResponse.json(
          { error: "Title must be a non-empty string." },
          { status: 400 },
        );
      }
      updates.push("title = ?");
      values.push(body.title.trim());
    }

    if (body.description !== undefined) {
      if (
        typeof body.description !== "string" ||
        !body.description.trim()
      ) {
        return NextResponse.json(
          { error: "Description must be a non-empty string." },
          { status: 400 },
        );
      }
      updates.push("description = ?");
      values.push(body.description.trim());
    }

    for (const [field, value] of [
      ["severity", body.severity],
      ["confidence", body.confidence],
      ["technique", body.technique],
      ["author", body.author],
    ] as const) {
      if (value !== undefined) {
        if (
          value !== null &&
          typeof value !== "string"
        ) {
          return NextResponse.json(
            { error: `${field} must be a string or null.` },
            { status: 400 },
          );
        }

        updates.push(`${field} = ?`);
        values.push(
          typeof value === "string" ? value : null,
        );
      }
    }

    for (const [field, value] of [
      ["evidence_ids", body.evidenceIds],
      ["entity_ids", body.entityIds],
      ["event_ids", body.eventIds],
    ] as const) {
      if (value !== undefined) {
        if (
          !Array.isArray(value) ||
          value.some((item) => typeof item !== "string")
        ) {
          return NextResponse.json(
            { error: `${field} must be an array of strings.` },
            { status: 400 },
          );
        }

        updates.push(`${field} = ?`);
        values.push(JSON.stringify(value));
      }
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No finding changes supplied." },
        { status: 400 },
      );
    }

    updates.push("updated_at = ?");
    values.push(new Date().toISOString());

    values.push(caseId, findingId);

    const result = await env.DB
      .prepare(
        `UPDATE findings
         SET ${updates.join(", ")}
         WHERE case_id = ? AND id = ?`,
      )
      .bind(...values)
      .run();

    if (!result.meta.changes) {
      return NextResponse.json(
        { error: "Finding not found." },
        { status: 404 },
      );
    }

    const updated = await env.DB
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
        WHERE case_id = ? AND id = ?
        LIMIT 1`,
      )
      .bind(caseId, findingId)
      .first();

    return NextResponse.json({ finding: updated });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update finding.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
