import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";
import { PrintReportButton } from "@/components/ir/PrintReportButton";

export const dynamic = "force-dynamic";

interface CaseSummary {
  id: string;
  title: string;
  severity: string;
  status: string;
  riskScore: number;
}

interface ReportData {
  cases: number;
  activeCases: number;
  highRiskCases: number;
  findings: number;
  responseActions: number;
  playbooks: number;
  recentCases: CaseSummary[];
}

async function getReportData(): Promise<ReportData> {
  const { env } = await getCloudflareContext({ async: true });

  const [
    caseCount,
    activeCaseCount,
    highRiskCount,
    findingCount,
    responseCount,
    playbookCount,
    recentCases,
  ] = await Promise.all([
    env.DB
      .prepare("SELECT COUNT(*) AS count FROM cases")
      .first<{ count: number }>(),

    env.DB
      .prepare(
        `SELECT COUNT(*) AS count
         FROM cases
         WHERE LOWER(status) NOT IN ('closed', 'resolved')`,
      )
      .first<{ count: number }>(),

    env.DB
      .prepare(
        `SELECT COUNT(*) AS count
         FROM cases
         WHERE risk_score >= 80`,
      )
      .first<{ count: number }>(),

    env.DB
      .prepare("SELECT COUNT(*) AS count FROM findings")
      .first<{ count: number }>(),

    env.DB
      .prepare("SELECT COUNT(*) AS count FROM response_actions")
      .first<{ count: number }>(),

    env.DB
      .prepare("SELECT COUNT(*) AS count FROM playbook_runs")
      .first<{ count: number }>(),

    env.DB
      .prepare(
        `SELECT
          id,
          title,
          severity,
          status,
          risk_score AS riskScore
        FROM cases
        ORDER BY updated_at DESC
        LIMIT 8`,
      )
      .all<CaseSummary>(),
  ]);

  return {
    cases: Number(caseCount?.count ?? 0),
    activeCases: Number(activeCaseCount?.count ?? 0),
    highRiskCases: Number(highRiskCount?.count ?? 0),
    findings: Number(findingCount?.count ?? 0),
    responseActions: Number(responseCount?.count ?? 0),
    playbooks: Number(playbookCount?.count ?? 0),
    recentCases: recentCases.results ?? [],
  };
}

export default async function Page() {
  const data = await getReportData();

  return (
    <NavigationRoute
      eyebrow="Reporting"
      title="Reports"
      description="Operational investigation reporting backed by persisted case, finding, response, and playbook data."
    >
      <div className="space-y-4" id="report-content">
        <section className="rounded-2xl border border-[#263441] bg-[#0B1016]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#263441] px-5 py-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#4F8CFF]" />
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#59616D]">
                  Investigation Report
                </span>
              </div>

              <h2 className="mt-2 text-[18px] font-semibold text-[#E7ECF2]">
                Security operations summary
              </h2>

              <p className="mt-1 text-[11px] text-[#69727E]">
                Current persisted investigation posture from D1.
              </p>
            </div>

            <PrintReportButton />
          </div>

          <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <ReportMetric
              label="Total Cases"
              value={data.cases}
              icon={BarChart3}
            />

            <ReportMetric
              label="Active Cases"
              value={data.activeCases}
              icon={Activity}
            />

            <ReportMetric
              label="High Risk Cases"
              value={data.highRiskCases}
              icon={AlertTriangle}
            />

            <ReportMetric
              label="Findings"
              value={data.findings}
              icon={ShieldCheck}
            />

            <ReportMetric
              label="Response Actions"
              value={data.responseActions}
              icon={Activity}
            />

            <ReportMetric
              label="Playbook Runs"
              value={data.playbooks}
              icon={FileText}
            />
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
          <div className="border-b border-[#263441] px-4 py-4">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Recent Cases
            </div>

            <div className="mt-1 text-[11px] text-[#69727E]">
              Latest persisted investigation activity
            </div>
          </div>

          {data.recentCases.length === 0 ? (
            <div className="px-4 py-8 text-center text-[10px] text-[#69727E]">
              No persisted cases are available.
            </div>
          ) : (
            <div className="divide-y divide-[#263441]">
              {data.recentCases.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1.5fr)_100px_120px_80px]"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-[#59616D]">
                      {item.id}
                    </div>

                    <div className="mt-1 truncate text-[12px] font-medium text-[#D9DEE7]">
                      {item.title}
                    </div>
                  </div>

                  <span className="self-center text-[10px] uppercase text-[#A7AFBA]">
                    {item.severity}
                  </span>

                  <span className="self-center text-[10px] uppercase text-[#35D6A1]">
                    {item.status}
                  </span>

                  <span
                    className={`self-center font-mono text-[12px] font-semibold ${
                      item.riskScore >= 80
                        ? "text-[#FF5364]"
                        : item.riskScore >= 50
                          ? "text-[#FFB84D]"
                          : "text-[#35D6A1]"
                    }`}
                  >
                    {item.riskScore}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </NavigationRoute>
  );
}

function ReportMetric({
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

      <div className="mt-3 font-mono text-[24px] font-semibold text-[#E7ECF2]">
        {value}
      </div>
    </div>
  );
}
