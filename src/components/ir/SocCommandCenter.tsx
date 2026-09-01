"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileSearch,
  Play,
  ShieldAlert,
  ShieldCheck,
  Siren,
  XCircle,
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardData {
  telemetry: {
    totalAlerts: number;
    criticalAlerts: number;
    highAlerts: number;
    mediumAlerts: number;
    lowAlerts: number;
    endpoints: number;
    topSourceIps: { ip: string; count: number }[];
    systemHealth: number;
  };
  incidents: Array<{
    id: string;
    title: string;
    severity: string;
    source: string;
    endpoint: string;
    technique: string | null;
    firstSeen: string;
    lastSeen: string;
    occurrences: number;
    status: string;
  }>;
  cases: Array<{
    id: string;
    title: string;
    severity: string;
    status: string;
    phase: string;
    owner: string;
    affectedEndpoint: string | null;
    riskScore: number;
    updatedAt: string;
  }>;
  activity: Array<{
    id: string;
    incident_id: string;
    actor: string;
    action: string;
    detail: string | null;
    created_at: string;
  }>;
  response: Array<{
    id: string;
    case_id: string;
    name: string;
    target: string;
    status: string;
    requested_at: string;
    completed_at: string | null;
    error: string | null;
  }>;
  playbooks: Array<{
    id: string;
    case_id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>;
  generatedAt: string;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function severityClass(severity: string) {
  const value = severity.toLowerCase();

  if (value === "critical") {
    return "border-[#FF5364]/20 bg-[#FF5364]/[0.05] text-[#FF5364]";
  }

  if (value === "high") {
    return "border-[#FFB84D]/20 bg-[#FFB84D]/[0.05] text-[#FFB84D]";
  }

  if (value === "medium") {
    return "border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.05] text-[#4F8CFF]";
  }

  return "border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] text-[#35D6A1]";
}

function statusClass(status: string) {
  const value = status.toLowerCase();

  if (["succeeded", "completed", "contained", "confirmed"].includes(value)) {
    return "text-[#35D6A1]";
  }

  if (["failed", "error", "rejected"].includes(value)) {
    return "text-[#FF5364]";
  }

  return "text-[#FFB84D]";
}

export function SocCommandCenter() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    try {
      const response = await fetch("/api/dashboard", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load SOC dashboard data.");
      }

      const next = (await response.json()) as DashboardData;
      setData(next);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load SOC dashboard data.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const metrics = useMemo(() => {
    if (!data) {
      return [];
    }

    const criticalCases = data.cases.filter(
      (item) => item.severity.toLowerCase() === "critical",
    );

    const highRiskCases = data.cases.filter(
      (item) => item.riskScore >= 80,
    );

    const activeCases = data.cases.filter(
      (item) =>
        !["closed", "resolved"].includes(item.status.toLowerCase()),
    );

    return [
      {
        label: "Critical Alerts",
        value: formatNumber(data.telemetry.criticalAlerts),
        detail: "Live Wazuh telemetry",
        href: "/incidents?severity=critical",
        icon: AlertTriangle,
        className: "text-[#FF5364]",
      },
      {
        label: "Active Cases",
        value: formatNumber(activeCases.length),
        detail: `${criticalCases.length} critical`,
        href: "/cases?status=active",
        icon: Siren,
        className: "text-[#FFB84D]",
      },
      {
        label: "High Risk Cases",
        value: formatNumber(highRiskCases.length),
        detail: "Risk score ? 80",
        href: "/cases?risk=high",
        icon: ShieldAlert,
        className: "text-[#7C6CFF]",
      },
      {
        label: "Total Alerts",
        value: formatNumber(data.telemetry.totalAlerts),
        detail: `${data.telemetry.endpoints} endpoints`,
        href: "/incidents",
        icon: Activity,
        className: "text-[#4F8CFF]",
      },
    ];
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse rounded-2xl border border-[#263441] bg-[#0B1016] p-5">
          <div className="h-3 w-40 rounded bg-[#17212B]" />
          <div className="mt-3 h-7 w-64 rounded bg-[#17212B]" />
          <div className="mt-2 h-3 w-80 rounded bg-[#17212B]" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-[#263441] bg-[#101720]"
            />
          ))}
        </div>

        <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
          <div className="h-72 animate-pulse rounded-xl border border-[#263441] bg-[#101720]" />
          <div className="h-72 animate-pulse rounded-xl border border-[#263441] bg-[#101720]" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-2xl border border-[#FF5364]/20 bg-[#0B1016] p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05]">
            <ShieldAlert className="h-4 w-4 text-[#FF5364]" />
          </div>

          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#FF5364]">
              Dashboard unavailable
            </div>
            <div className="mt-1 text-[11px] leading-5 text-[#69727E]">
              {error ?? "No dashboard data is available right now."}
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-4 rounded-lg border border-[#FF5364]/20 px-3 py-2 text-[10px] font-medium text-[#FF8A96] transition hover:border-[#FF5364]/40 hover:bg-[#FF5364]/[0.05]"
            >
              Retry dashboard
            </button>
          </div>
        </div>
      </section>
    );
  }

  const successfulResponses = data.response.filter(
    (item) => item.status.toLowerCase() === "succeeded",
  ).length;

  const failedResponses = data.response.filter(
    (item) =>
      ["failed", "error"].includes(item.status.toLowerCase()),
  ).length;

  const completedPlaybooks = data.playbooks.filter(
    (item) => item.status.toLowerCase() === "completed",
  ).length;

  return (
    <div className="space-y-4">
      <motion.section
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#263441] bg-[#0B1016]"
      >
        <div className="flex flex-col gap-4 border-b border-[#263441]/70 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#35D6A1]" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
                SOC Command Center
              </span>
            </div>

            <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.02em] text-[#F5F7FA]">
              Security operations overview
            </h1>

            <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-[#7E8794]">
              Live Wazuh telemetry combined with persisted investigations,
              response actions, and playbook activity.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-[#35D6A1]/20 bg-[#35D6A1]/[0.04] px-3 py-2 text-[9px] font-medium uppercase tracking-[0.1em] text-[#35D6A1]">
              Wazuh {data.telemetry.systemHealth}%
            </div>

            <button
              type="button"
              onClick={() => void loadDashboard(true)}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 py-2 text-[9px] font-medium text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;

            return (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <Link
                  href={metric.href}
                  className="group block rounded-xl border border-[#263441] bg-[#101720] p-4 transition hover:-translate-y-0.5 hover:border-[#3A4652] hover:bg-[#121A22]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                      {metric.label}
                    </span>
                    <Icon className={`h-3.5 w-3.5 ${metric.className} transition group-hover:scale-105`} />
                  </div>

                  <div className="mt-3 text-[26px] font-semibold tracking-tight text-[#E7ECF2]">
                    {metric.value}
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[9px] text-[#69727E]">
                      {metric.detail}
                    </span>
                    <ArrowUpRight className="h-3 w-3 shrink-0 text-[#4F5660] transition group-hover:text-[#8B93A1]" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      <div className="grid gap-3 xl:grid-cols-[1.35fr_1fr]">
        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-xl border border-[#263441] bg-[#101720]"
        >
          <div className="flex items-center justify-between border-b border-[#263441]/70 px-4 py-3.5">
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Priority Incidents
              </div>
              <div className="mt-1 text-[10px] text-[#69727E]">
                Highest-severity live Wazuh detections
              </div>
            </div>

            <Link
              href="/incidents"
              className="flex items-center gap-1 text-[9px] font-medium text-[#4F8CFF] hover:text-white"
            >
              View all
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-[#263441]/60">
            {data.incidents.length > 0 ? (
              data.incidents.slice(0, 6).map((incident, index) => (
                <motion.div
                  key={`${incident.id}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.12 + index * 0.03 }}
                  className="block"
                >
                  <Link
                    href={`/incidents/${encodeURIComponent(incident.id)}`}
                    className="block px-4 py-3.5 transition hover:bg-white/[0.018]"
                  >
                    <div className="flex items-start gap-3">
                    <div
                      className={`rounded-md border px-2 py-1 text-[8px] font-semibold uppercase ${severityClass(
                        incident.severity,
                      )}`}
                    >
                      {incident.severity}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-[#E7ECF2]">
                        {incident.title}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-[#69727E]">
                        <span>{incident.endpoint}</span>
                        <span>{incident.source}</span>
                        {incident.technique && (
                          <span>{incident.technique}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[9px] text-[#C7CDD6]">
                        {incident.occurrences}
                      </div>
                      <div className="mt-0.5 text-[8px] text-[#59616D]">
                        hits
                      </div>
                    </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[10px] text-[#59616D]">
                No priority incidents available.
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-xl border border-[#263441] bg-[#101720]"
        >
          <div className="border-b border-[#263441]/70 px-4 py-3.5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Risk Overview
            </div>
            <div className="mt-1 text-[10px] text-[#69727E]">
              Persisted case risk posture
            </div>
          </div>

          <div className="space-y-2 p-4">
            {data.cases.length > 0 ? (
              data.cases.slice(0, 6).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.04 }}
                >
                  <Link
                    href={`/cases/${encodeURIComponent(item.id)}`}
                    className="block rounded-lg border border-[#263441] bg-[#0B1016] p-3 transition hover:border-[#3A4652] hover:bg-white/[0.015]"
                  >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[9px] text-[#59616D]">
                        {item.id}
                      </div>
                      <div className="mt-1 truncate text-[10px] font-medium text-[#D9DEE7]">
                        {item.title}
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-mono text-[15px] font-semibold ${
                          item.riskScore >= 80
                            ? "text-[#FF5364]"
                            : item.riskScore >= 50
                              ? "text-[#FFB84D]"
                              : "text-[#35D6A1]"
                        }`}
                      >
                        {item.riskScore}
                      </div>
                      <div className="text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
                        risk
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#18222D]">
                    <div
                      className="h-full rounded-full bg-current"
                      style={{
                        width: `${Math.min(Math.max(item.riskScore, 0), 100)}%`,
                        color:
                          item.riskScore >= 80
                            ? "#FF5364"
                            : item.riskScore >= 50
                              ? "#FFB84D"
                              : "#35D6A1",
                      }}
                    />
                  </div>
                  </Link>
                </motion.div>
              ))
            ) : (
              <div className="py-8 text-center text-[10px] text-[#59616D]">
                No persisted cases available.
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr_0.9fr]">
        <section className="rounded-xl border border-[#263441] bg-[#101720]">
          <div className="border-b border-[#263441]/70 px-4 py-3.5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Recent Activity
            </div>
            <div className="mt-1 text-[10px] text-[#69727E]">
              Latest persisted analyst actions
            </div>
          </div>

          <div className="divide-y divide-[#263441]/60">
            {data.activity.length > 0 ? (
              data.activity.slice(0, 5).map((item) => (
                <div key={item.id} className="flex gap-3 px-4 py-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[#263441] bg-[#0B1016]">
                    <FileSearch className="h-3 w-3 text-[#7C6CFF]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium text-[#D9DEE7]">
                      {item.action.replaceAll("_", " ")}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[9px] leading-4 text-[#69727E]">
                      {item.detail ?? "Activity recorded."}
                    </div>
                    <div className="mt-1 text-[8px] text-[#59616D]">
                      {item.actor} � {formatTime(item.created_at)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-[10px] text-[#59616D]">
                No persisted activity available.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#263441] bg-[#101720]">
          <div className="border-b border-[#263441]/70 px-4 py-3.5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Response Posture
            </div>
            <div className="mt-1 text-[10px] text-[#69727E]">
              Persisted response execution state
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-[#A7AFBA]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#35D6A1]" />
                Succeeded
              </div>
              <span className="font-mono text-[14px] font-semibold text-[#35D6A1]">
                {successfulResponses}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-[#A7AFBA]">
                <XCircle className="h-3.5 w-3.5 text-[#FF5364]" />
                Failed
              </div>
              <span className="font-mono text-[14px] font-semibold text-[#FF5364]">
                {failedResponses}
              </span>
            </div>

            <div className="border-t border-[#263441]/70 pt-3">
              <div className="text-[9px] text-[#59616D]">
                Latest action
              </div>

              {data.response[0] ? (
                <div className="mt-1">
                  <div className="text-[10px] font-medium text-[#D9DEE7]">
                    {data.response[0].name}
                  </div>
                  <div className="mt-0.5 truncate text-[9px] text-[#69727E]">
                    {data.response[0].target}
                  </div>
                  <div
                    className={`mt-1 text-[8px] font-semibold uppercase ${statusClass(
                      data.response[0].status,
                    )}`}
                  >
                    {data.response[0].status}
                  </div>
                </div>
              ) : (
                <div className="mt-1 text-[9px] text-[#59616D]">
                  No response actions recorded.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#263441] bg-[#101720]">
          <div className="border-b border-[#263441]/70 px-4 py-3.5">
            <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
              Playbook Posture
            </div>
            <div className="mt-1 text-[10px] text-[#69727E]">
              Persisted automation state
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#263441] bg-[#0B1016] p-3">
                <Bot className="h-3.5 w-3.5 text-[#7C6CFF]" />
                <div className="mt-2 font-mono text-lg font-semibold text-[#E7ECF2]">
                  {data.playbooks.length}
                </div>
                <div className="text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
                  Total runs
                </div>
              </div>

              <div className="rounded-lg border border-[#263441] bg-[#0B1016] p-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#35D6A1]" />
                <div className="mt-2 font-mono text-lg font-semibold text-[#E7ECF2]">
                  {completedPlaybooks}
                </div>
                <div className="text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
                  Completed
                </div>
              </div>
            </div>

            {data.playbooks[0] && (
              <div className="mt-3 rounded-lg border border-[#263441] bg-[#0B1016] p-3">
                <div className="flex items-center gap-2 text-[9px] text-[#59616D]">
                  <Play className="h-3 w-3" />
                  Latest run
                </div>
                <div className="mt-1 text-[10px] font-medium text-[#D9DEE7]">
                  {data.playbooks[0].name}
                </div>
                <div
                  className={`mt-1 text-[8px] font-semibold uppercase ${statusClass(
                    data.playbooks[0].status,
                  )}`}
                >
                  {data.playbooks[0].status}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#35D6A1]" />
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Wazuh Health
              </div>
              <div className="mt-1 text-[10px] text-[#69727E]">
                Connected telemetry posture
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <div className="text-[31px] font-semibold tracking-tight text-[#35D6A1]">
                {data.telemetry.systemHealth}%
              </div>
              <div className="mt-1 text-[9px] text-[#59616D]">
                System health
              </div>
            </div>

            <div className="text-right">
              <div className="font-mono text-[15px] font-semibold text-[#E7ECF2]">
                {formatNumber(data.telemetry.endpoints)}
              </div>
              <div className="text-[8px] uppercase tracking-[0.08em] text-[#59616D]">
                endpoints
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#19242F]">
            <motion.div
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min(data.telemetry.systemHealth, 100)}%`,
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full rounded-full bg-[#35D6A1]"
            />
          </div>
        </div>

        <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-[#4F8CFF]" />
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Telemetry Snapshot
              </div>
              <div className="mt-1 text-[10px] text-[#69727E]">
                Most recent dashboard aggregation
              </div>
            </div>
          </div>

          <div className="mt-5 font-mono text-[12px] text-[#D9DEE7]">
            {new Date(data.generatedAt).toLocaleString()}
          </div>

          {data.telemetry.topSourceIps[0] && (
            <div className="mt-4 flex items-center justify-between border-t border-[#263441]/70 pt-3">
              <span className="text-[9px] uppercase tracking-[0.08em] text-[#59616D]">
                Top source
              </span>
              <span className="font-mono text-[9px] text-[#C7CDD6]">
                {data.telemetry.topSourceIps[0].ip}
                {" � "}
                {formatNumber(data.telemetry.topSourceIps[0].count)}
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
