"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";

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

interface Metadata {
  incidentId: string;
  status: IncidentStatus;
  priority: IncidentPriority;
  assignee: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export function IncidentMetadataControls({
  incidentId,
  fallbackStatus,
}: {
  incidentId: string;
  fallbackStatus: string;
}) {
  const [metadata, setMetadata] = useState<Metadata | null>(null);
  const [status, setStatus] = useState<IncidentStatus>(
    fallbackStatus as IncidentStatus,
  );
  const [priority, setPriority] = useState<IncidentPriority>("medium");
  const [assignee, setAssignee] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMetadata() {
      try {
        const response = await fetch(
          `/api/incidents/${encodeURIComponent(incidentId)}/metadata`,
          {
            cache: "no-store",
          },
        );

        const data = (await response.json()) as {
          metadata?: Metadata;
          error?: string;
        };

        if (!response.ok || !data.metadata) {
          throw new Error(data.error ?? "Unable to load incident metadata.");
        }

        if (!cancelled) {
          setMetadata(data.metadata);
          setStatus(data.metadata.status);
          setPriority(data.metadata.priority);
          setAssignee(data.metadata.assignee ?? "");
          setNotes(data.metadata.notes ?? "");
          setTags(data.metadata.tags.join(", "));
          setError(null);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load incident metadata.",
          );
          setLoading(false);
        }
      }
    }

    void loadMetadata();

    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  async function saveMetadata() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const response = await fetch(
        `/api/incidents/${encodeURIComponent(incidentId)}/metadata`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            priority,
            assignee: assignee.trim() || null,
            notes: notes.trim() || null,
            tags: tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean),
          }),
        },
      );

      const data = (await response.json()) as {
        metadata?: Metadata;
        error?: string;
      };

      if (!response.ok || !data.metadata) {
        throw new Error(data.error ?? "Unable to save incident metadata.");
      }

      setMetadata(data.metadata);
      setStatus(data.metadata.status);
      setPriority(data.metadata.priority);
      setAssignee(data.metadata.assignee ?? "");
      setNotes(data.metadata.notes ?? "");
      setTags(data.metadata.tags.join(", "));
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save incident metadata.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
        <div className="flex items-center gap-2 text-[10px] text-[#69727E]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading incident controls...
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-[#263441] bg-[#101720]">
      <div className="border-b border-[#263441] px-4 py-3">
        <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
          Analyst Controls
        </div>

        <div className="mt-1 text-[12px] font-medium text-[#D9DEE7]">
          Incident management
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Field label="Status">
          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as IncidentStatus)
            }
            className="w-full rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2 text-[10px] text-[#D9DEE7] outline-none transition focus:border-[#4F8CFF]/50"
          >
            <option value="detected">Detected</option>
            <option value="triage">Triage</option>
            <option value="investigating">Investigating</option>
            <option value="confirmed">Confirmed</option>
            <option value="contained">Contained</option>
            <option value="eradication">Eradication</option>
            <option value="recovery">Recovery</option>
            <option value="closed">Closed</option>
          </select>
        </Field>

        <Field label="Priority">
          <select
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IncidentPriority)
            }
            className="w-full rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2 text-[10px] text-[#D9DEE7] outline-none transition focus:border-[#4F8CFF]/50"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </Field>

        <Field label="Assignee">
          <input
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            placeholder="Analyst name"
            className="w-full rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2 text-[10px] text-[#D9DEE7] placeholder:text-[#4F5660] outline-none transition focus:border-[#4F8CFF]/50"
          />
        </Field>

        <Field label="Tags">
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="windows, wazuh, investigation"
            className="w-full rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2 text-[10px] text-[#D9DEE7] placeholder:text-[#4F5660] outline-none transition focus:border-[#4F8CFF]/50"
          />
        </Field>

        <div className="sm:col-span-2">
          <Field label="Analyst Notes">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              placeholder="Document triage observations, decisions, or next steps..."
              className="w-full resize-none rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2 text-[10px] leading-5 text-[#D9DEE7] placeholder:text-[#4F5660] outline-none transition focus:border-[#4F8CFF]/50"
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
          <div className="text-[9px] text-[#59616D]">
            {metadata
              ? `Last saved ${new Date(metadata.updatedAt).toLocaleString("en-IN")}`
              : "Not saved yet"}
          </div>

          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-[9px] text-[#35D6A1]">
                <Check className="h-3 w-3" />
                Saved
              </span>
            )}

            <button
              type="button"
              onClick={saveMetadata}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#4F8CFF] px-3 py-2 text-[10px] font-medium text-white transition hover:bg-[#62AEFF] disabled:cursor-wait disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {error && (
          <div className="sm:col-span-2 rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05] px-3 py-2 text-[9px] text-[#FF8A96]">
            {error}
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[8px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </span>
      {children}
    </label>
  );
}
