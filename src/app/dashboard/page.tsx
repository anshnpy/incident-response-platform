import { Activity, AlertTriangle, Server, ShieldCheck } from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

interface WazuhSummary {
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  endpoints: number;
  topSourceIps: {
    ip: string;
    count: number;
  }[];
  systemHealth: number;
}

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/summary";

async function getSummary(): Promise<WazuhSummary | null> {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as WazuhSummary;
  } catch {
    return null;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function Page() {
  const summary = await getSummary();

  return (
    <NavigationRoute
      eyebrow="Operations"
      title="Dashboard"
      description="Operational overview of active investigations, response posture, and security telemetry."
    >
      {summary ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total Alerts"
              value={formatNumber(summary.totalAlerts)}
              icon={Activity}
            />

            <MetricCard
              label="Critical Alerts"
              value={formatNumber(summary.criticalAlerts)}
              icon={AlertTriangle}
              tone="critical"
            />

            <MetricCard
              label="High Alerts"
              value={formatNumber(summary.highAlerts)}
              icon={AlertTriangle}
              tone="high"
            />

            <MetricCard
              label="Endpoints"
              value={formatNumber(summary.endpoints)}
              icon={Server}
            />
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                    Alert Distribution
                  </div>

                  <div className="mt-1 text-[10px] text-[#69727E]">
                    Current Wazuh alert severity mix
                  </div>
                </div>

                <span className="font-mono text-[10px] text-[#8B93A1]">
                  {formatNumber(summary.totalAlerts)} TOTAL
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <SeverityRow
                  label="Critical"
                  value={summary.criticalAlerts}
                  total={summary.totalAlerts}
                  tone="critical"
                />

                <SeverityRow
                  label="High"
                  value={summary.highAlerts}
                  total={summary.totalAlerts}
                  tone="high"
                />

                <SeverityRow
                  label="Medium"
                  value={summary.mediumAlerts}
                  total={summary.totalAlerts}
                  tone="medium"
                />

                <SeverityRow
                  label="Low"
                  value={summary.lowAlerts}
                  total={summary.totalAlerts}
                  tone="low"
                />
              </div>
            </section>

            <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#35D6A1]" />

                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                    System Health
                  </div>

                  <div className="mt-1 text-[10px] text-[#69727E]">
                    Wazuh environment availability
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-[#35D6A1]">
                  {summary.systemHealth}%
                </span>

                <span className="pb-1 text-[9px] uppercase tracking-[0.08em] text-[#59616D]">
                  Healthy
                </span>
              </div>

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#1B2632]">
                <div
                  className="h-full rounded-full bg-[#35D6A1]"
                  style={{ width: `${Math.min(summary.systemHealth, 100)}%` }}
                />
              </div>

              <div className="mt-5 border-t border-[#1B2430] pt-3">
                <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                  Endpoints
                </div>

                <div className="mt-1 font-mono text-[13px] text-[#D9DEE7]">
                  {formatNumber(summary.endpoints)} online
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                  Top Source IPs
                </div>

                <div className="mt-1 text-[10px] text-[#69727E]">
                  Highest-volume source indicators in current telemetry
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {summary.topSourceIps.length > 0 ? (
                summary.topSourceIps.map((source) => (
                  <div
                    key={source.ip}
                    className="flex items-center justify-between rounded-lg border border-[#1B2430] bg-[#0B1016] px-3 py-2.5"
                  >
                    <span className="font-mono text-[10px] text-[#D9DEE7]">
                      {source.ip}
                    </span>

                    <span className="font-mono text-[10px] font-semibold text-[#4F8CFF]">
                      {formatNumber(source.count)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-[#59616D]">
                  No source IP telemetry available.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <div className="rounded-xl border border-[#FFB84D]/20 bg-[#FFB84D]/[0.035] p-5">
          <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#FFB84D]">
            Wazuh telemetry unavailable
          </div>

          <div className="mt-1.5 text-[10px] leading-5 text-[#69727E]">
            The dashboard could not retrieve the current SOC Lab summary.
            Start the Wazuh environment and retry the dashboard.
          </div>
        </div>
      )}
    </NavigationRoute>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof Activity;
  tone?: "default" | "critical" | "high";
}) {
  const toneClass =
    tone === "critical"
      ? "text-[#FF5364]"
      : tone === "high"
        ? "text-[#FFB84D]"
        : "text-[#4F8CFF]";

  return (
    <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
      <div className="flex items-center justify-between">
        <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
          {label}
        </div>

        <Icon className={`h-3.5 w-3.5 ${toneClass}`} />
      </div>

      <div className="mt-3 text-2xl font-semibold tracking-tight text-[#E7ECF2]">
        {value}
      </div>
    </div>
  );
}

function SeverityRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: "critical" | "high" | "medium" | "low";
}) {
  const color =
    tone === "critical"
      ? "bg-[#FF5364]"
      : tone === "high"
        ? "bg-[#FFB84D]"
        : tone === "medium"
          ? "bg-[#4F8CFF]"
          : "bg-[#35D6A1]";

  const textColor =
    tone === "critical"
      ? "text-[#FF5364]"
      : tone === "high"
        ? "text-[#FFB84D]"
        : tone === "medium"
          ? "text-[#4F8CFF]"
          : "text-[#35D6A1]";

  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-[9px]">
        <span className="uppercase tracking-[0.06em] text-[#69727E]">
          {label}
        </span>

        <span className={`font-mono font-semibold ${textColor}`}>
          {formatNumber(value)}
        </span>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1B2632]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
