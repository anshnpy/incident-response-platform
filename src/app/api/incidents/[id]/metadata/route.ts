import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

type IncidentStatus =
  | "detected"
  | "triage"
  | "investigating"
  | "confirmed"
  | "contained"
  | "eradication"
  | "recovery"
  | "closed";

type IncidentPriority = "low" | "medium" | "high" | "critical";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

interface IncidentMetadataRow {
  incident_id: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignee: string | null;
  notes: string | null;
  tags: string;
  created_at: string;
  updated_at: string;
}

const validStatuses = new Set<IncidentStatus>([
  "detected",
  "triage",
  "investigating",
  "confirmed",
  "contained",
  "eradication",
  "recovery",
  "closed",
]);

const validPriorities = new Set<IncidentPriority>([
  "low",
  "medium",
  "high",
  "critical",
]);

function parseTags(value: string | null | undefined): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is string =>
        typeof item === "string" && item.trim().length > 0,
    );
  } catch {
    return [];
  }
}

function mapMetadata(row: IncidentMetadataRow) {
  return {
    incidentId: row.incident_id,
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    notes: row.notes,
    tags: parseTags(row.tags),
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
    const { id } = await params;

    const existing = await env.DB
      .prepare(
        `SELECT
          incident_id,
          status,
          priority,
          assignee,
          notes,
          tags,
          created_at,
          updated_at
        FROM incident_metadata
        WHERE incident_id = ?
        LIMIT 1`,
      )
      .bind(id)
      .first<IncidentMetadataRow>();

    if (existing) {
      return NextResponse.json({
        metadata: mapMetadata(existing),
      });
    }

    const now = new Date().toISOString();

    return NextResponse.json({
      metadata: {
        incidentId: id,
        status: "detected" as IncidentStatus,
        priority: "medium" as IncidentPriority,
        assignee: null,
        notes: null,
        tags: [],
        createdAt: now,
        updatedAt: now,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to load incident metadata.",
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
    const body = (await request.json()) as {
      status?: unknown;
      priority?: unknown;
      assignee?: unknown;
      notes?: unknown;
      tags?: unknown;
    };

    if (
      body.status !== undefined &&
      (typeof body.status !== "string" ||
        !validStatuses.has(body.status as IncidentStatus))
    ) {
      return NextResponse.json(
        { error: "Invalid incident status." },
        { status: 400 },
      );
    }

    if (
      body.priority !== undefined &&
      (typeof body.priority !== "string" ||
        !validPriorities.has(body.priority as IncidentPriority))
    ) {
      return NextResponse.json(
        { error: "Invalid incident priority." },
        { status: 400 },
      );
    }

    if (
      body.assignee !== undefined &&
      body.assignee !== null &&
      typeof body.assignee !== "string"
    ) {
      return NextResponse.json(
        { error: "Assignee must be a string or null." },
        { status: 400 },
      );
    }

    if (
      body.notes !== undefined &&
      body.notes !== null &&
      typeof body.notes !== "string"
    ) {
      return NextResponse.json(
        { error: "Notes must be a string or null." },
        { status: 400 },
      );
    }

    if (
      body.tags !== undefined &&
      (!Array.isArray(body.tags) ||
        body.tags.some(
          (tag) => typeof tag !== "string" || tag.trim().length === 0,
        ))
    ) {
      return NextResponse.json(
        { error: "Tags must be an array of non-empty strings." },
        { status: 400 },
      );
    }

    const existing = await env.DB
      .prepare(
        `SELECT
          incident_id,
          status,
          priority,
          assignee,
          notes,
          tags,
          created_at,
          updated_at
        FROM incident_metadata
        WHERE incident_id = ?
        LIMIT 1`,
      )
      .bind(id)
      .first<IncidentMetadataRow>();

    const now = new Date().toISOString();

    if (!existing) {
      const status =
        typeof body.status === "string"
          ? body.status
          : "detected";

      const priority =
        typeof body.priority === "string"
          ? body.priority
          : "medium";

      const assignee =
        typeof body.assignee === "string"
          ? body.assignee
          : null;

      const notes =
        typeof body.notes === "string"
          ? body.notes
          : null;

      const tags = Array.isArray(body.tags)
        ? JSON.stringify(body.tags)
        : "[]";

      await env.DB
        .prepare(
          `INSERT INTO incident_metadata (
            incident_id,
            status,
            priority,
            assignee,
            notes,
            tags,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          id,
          status,
          priority,
          assignee,
          notes,
          tags,
          now,
          now,
        )
        .run();
    } else {
      const updates: string[] = [];
      const values: unknown[] = [];

      const oldValues: Record<string, string | null> = {
        status: existing.status,
        priority: existing.priority,
        assignee: existing.assignee,
        notes: existing.notes,
        tags: JSON.stringify(parseTags(existing.tags)),
      };

      const nextValues: Record<string, string | null> = {
        status:
          typeof body.status === "string"
            ? body.status
            : existing.status,
        priority:
          typeof body.priority === "string"
            ? body.priority
            : existing.priority,
        assignee:
          body.assignee !== undefined
            ? (body.assignee as string | null)
            : existing.assignee,
        notes:
          body.notes !== undefined
            ? (body.notes as string | null)
            : existing.notes,
        tags:
          body.tags !== undefined
            ? JSON.stringify(body.tags)
            : existing.tags,
      };

      if (body.status !== undefined) {
        updates.push("status = ?");
        values.push(body.status);
      }

      if (body.priority !== undefined) {
        updates.push("priority = ?");
        values.push(body.priority);
      }

      if (body.assignee !== undefined) {
        updates.push("assignee = ?");
        values.push(body.assignee);
      }

      if (body.notes !== undefined) {
        updates.push("notes = ?");
        values.push(body.notes);
      }

      if (body.tags !== undefined) {
        updates.push("tags = ?");
        values.push(JSON.stringify(body.tags));
      }

      updates.push("updated_at = ?");
      values.push(now);

      values.push(id);

      await env.DB
        .prepare(
          `UPDATE incident_metadata
           SET ${updates.join(", ")}
           WHERE incident_id = ?`,
        )
        .bind(...values)
        .run();

      const activityFields = [
        "status",
        "priority",
        "assignee",
        "notes",
        "tags",
      ] as const;

      for (const field of activityFields) {
        const oldValue = oldValues[field];
        const newValue = nextValues[field];

        if (oldValue === newValue) {
          continue;
        }

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
            id,
            "Anshuman Pandey",
            "updated",
            field,
            oldValue,
            newValue,
            `Incident ${field} updated.`,
            now,
          )
          .run();
      }
    }

    const updated = await env.DB
      .prepare(
        `SELECT
          incident_id,
          status,
          priority,
          assignee,
          notes,
          tags,
          created_at,
          updated_at
        FROM incident_metadata
        WHERE incident_id = ?
        LIMIT 1`,
      )
      .bind(id)
      .first<IncidentMetadataRow>();

    if (!updated) {
      throw new Error("Incident metadata was not persisted.");
    }

    return NextResponse.json({
      metadata: mapMetadata(updated),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Unable to update incident metadata.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
