import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, Clock3, Play, XCircle } from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

export const dynamic = "force-dynamic";

interface PlaybookRun {
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
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "completed":
      return "text-[#35D6A1]";
    case "running":
      return "text-[#4F8CFF]";
    case "failed":
      return "text-[#FF5364]";
    case "cancelled":
      return "text-[#8B93A1]";
    default:
      return "text-[#FFB84D]";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "completed":
      return <CheckCircle2 className="h-3.5 w-3.5 text-[#35D6A1]" />;
    case "running":
      return <Activity className="h-3.5 w-3.5 text-[#4F8CFF]" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-[#FF5364]" />;
    default:
      return <Clock3 className="h-3.5 w-3.5 text-[#FFB84D]" />;
  }
}

async function getPlaybookRuns(): Promise<PlaybookRun[]> {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const result = await env.DB
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
        ORDER BY updated_at DESC
        LIMIT 100`,
      )
      .all<PlaybookRun>();

    return result.results ?? [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const runs = await getPlaybookRuns();

  const completed = runs.filter(
    (run) => run.status.toLowerCase() === "completed",
  ).length;

  const running = runs.filter(
    (run) => run.status.toLowerCase() === "running",
  ).length;

  const failed = runs.filter((run) =>
    ["failed", "error"].includes(run.status.toLowerCase()),
  ).length;

  return (
    <NavigationRoute
      eyebrow="Automation"
      title="Playbooks"
      description="Review persisted investigation and containment workflow runs."
    >
      <div className="space-y-4">
        <section className="grid gap-2 sm:grid-cols-3">
          <SummaryMetric
            label="Total Runs"
            value={runs.length}
            icon={Play}
          />

          <SummaryMetric
            label="Running"
            value={running}
            icon={Activity}
          />

          <SummaryMetric
            label="Completed"
            value={completed}
            icon={CheckCircle2}
          />
        </section>

        {failed > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-[#FF5364]/20 bg-[#FF5364]/[0.04] px-4 py-3 text-[9px] text-[#FF8A96]">
            <XCircle className="h-3.5 w-3.5" />
            {failed} failed playbook run{failed === 1 ? "" : "s"} require attention.
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
          <div className="grid grid-cols-[minmax(0,1.3fr)_145px_110px_140px] border-b border-[#263441] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
            <span>Playbook</span>
            <span>Case</span>
            <span>Status</span>
            <span>Updated</span>
          </div>

          {runs.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                No playbook runs
              </div>

              <div className="mt-2 text-[11px] text-[#69727E]">
                No persisted automation runs are currently available.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#263441]">
              {runs.map((run) => (
                <Link
                  key={run.id}
                  href={`/cases/${encodeURIComponent(run.case_id)}`}
                  className="group grid grid-cols-[minmax(0,1.3fr)_145px_110px_140px] items-center gap-2 px-4 py-3 transition hover:bg-white/[0.018]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-medium text-[#D9DEE7]">
                      {run.name}
                    </div>

                    <div className="mt-0.5 truncate text-[8px] text-[#59616D]">
                      {run.description}
                    </div>

                    <div className="mt-1 font-mono text-[8px] text-[#4F5660]">
                      {run.id}
                    </div>
                  </div>

                  <span className="truncate font-mono text-[9px] text-[#8B93A1]">
                    {run.case_id}
                  </span>

                  <span className={`flex items-center gap-1.5 text-[9px] font-medium uppercase ${statusClass(run.status)}`}>
                    <StatusIcon status={run.status} />
                    {run.status}
                  </span>

                  <span className="flex items-center gap-1.5 text-[9px] text-[#69727E]">
                    {new Date(run.updated_at).toLocaleString("en-IN")}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </NavigationRoute>
  );
}

function SummaryMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
          {label}
        </span>

        <Icon className="h-3.5 w-3.5 text-[#4F8CFF]" />
      </div>

      <div className="mt-3 font-mono text-[23px] font-semibold text-[#E7ECF2]">
        {value}
      </div>
    </div>
  );
}
