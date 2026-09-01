import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileDown,
  Laptop2,
  Network,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

export const dynamic = "force-dynamic";

interface ResponseAction {
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

const iconMap = {
  "Isolate Host": Laptop2,
  "Disable Account": UserRound,
  "Block IOC": Network,
  "Collect Memory": FileDown,
};

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "succeeded":
      return "text-[#35D6A1]";
    case "running":
      return "text-[#FFB84D]";
    case "failed":
      return "text-[#FF5364]";
    default:
      return "text-[#4F8CFF]";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case "succeeded":
      return <CheckCircle2 className="h-3.5 w-3.5 text-[#35D6A1]" />;
    case "running":
      return <Activity className="h-3.5 w-3.5 text-[#FFB84D]" />;
    case "failed":
      return <XCircle className="h-3.5 w-3.5 text-[#FF5364]" />;
    default:
      return <Clock3 className="h-3.5 w-3.5 text-[#4F8CFF]" />;
  }
}

async function getResponseActions(): Promise<ResponseAction[]> {
  try {
    const { env } = await getCloudflareContext({ async: true });

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
        ORDER BY requested_at DESC
        LIMIT 100`,
      )
      .all<ResponseAction>();

    return result.results ?? [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const actions = await getResponseActions();

  const pending = actions.filter((item) =>
    ["requested", "approved"].includes(item.status.toLowerCase()),
  ).length;

  const running = actions.filter(
    (item) => item.status.toLowerCase() === "running",
  ).length;

  const succeeded = actions.filter(
    (item) => item.status.toLowerCase() === "succeeded",
  ).length;

  const failed = actions.filter(
    (item) => item.status.toLowerCase() === "failed",
  ).length;

  return (
    <NavigationRoute
      eyebrow="Containment"
      title="Response"
      description="Review persisted containment and remediation actions across active investigations."
    >
      <div className="space-y-4">
        <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryMetric label="Pending" value={pending} />
          <SummaryMetric label="Running" value={running} />
          <SummaryMetric label="Succeeded" value={succeeded} />
          <SummaryMetric label="Failed" value={failed} />
        </section>

        <section className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
          <div className="flex items-center gap-2 border-b border-[#263441] px-4 py-3.5">
            <ShieldAlert className="h-4 w-4 text-[#FF5364]" />

            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Response Operations
              </div>

              <div className="mt-1 text-[10px] text-[#69727E]">
                Case-scoped containment actions and execution state
              </div>
            </div>

            <span className="ml-auto font-mono text-[9px] text-[#59616D]">
              {actions.length} actions
            </span>
          </div>

          {actions.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                No response actions
              </div>

              <div className="mt-2 text-[11px] text-[#69727E]">
                No persisted containment or remediation actions are available.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[#263441]">
              {actions.map((action) => {
                const Icon =
                  iconMap[action.name as keyof typeof iconMap] ?? ShieldAlert;

                return (
                  <Link
                    key={action.id}
                    href={`/cases/${encodeURIComponent(action.case_id)}`}
                    className="group block px-4 py-3.5 transition hover:bg-white/[0.018]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#263441] bg-[#0B1016]">
                        <Icon className={`h-3.5 w-3.5 ${statusClass(action.status)}`} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-[#D9DEE7]">
                            {action.name}
                          </span>

                          <span className={`flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.08em] ${statusClass(action.status)}`}>
                            <StatusIcon status={action.status} />
                            {action.status}
                          </span>
                        </div>

                        <div className="mt-1 text-[9px] leading-4 text-[#69727E]">
                          {action.description}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[8px] text-[#59616D]">
                          <span>
                            CASE{" "}
                            <span className="font-mono text-[#8B93A1]">
                              {action.case_id}
                            </span>
                          </span>

                          <span>
                            TARGET{" "}
                            <span className="font-mono text-[#8B93A1]">
                              {action.target}
                            </span>
                          </span>

                          <span>
                            REQUESTED{" "}
                            <span className="text-[#8B93A1]">
                              {new Date(action.requested_at).toLocaleString("en-IN")}
                            </span>
                          </span>
                        </div>

                        {action.error && (
                          <div className="mt-2 rounded-md border border-[#FF5364]/15 bg-[#FF5364]/[0.035] px-2.5 py-2 text-[8px] text-[#FF8A96]">
                            {action.error}
                          </div>
                        )}
                      </div>

                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#59616D] transition group-hover:text-[#4F8CFF]" />
                    </div>
                  </Link>
                );
              })}
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
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
      <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
        {label}
      </div>

      <div className="mt-3 font-mono text-[23px] font-semibold text-[#E7ECF2]">
        {value}
      </div>
    </div>
  );
}
