"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CommandPalette } from "@/components/ir/CommandPalette";
import { useEffect, useState } from "react";
import {
  Archive,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FolderKanban,
  Globe2,
  Hexagon,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  SlidersHorizontal,
  Users,
  X,
  Zap,
} from "lucide-react";

interface InvestigationShellProps {
  children: ReactNode;
}

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: Siren,
  },
  {
    label: "Cases",
    href: "/cases",
    icon: FolderKanban,
  },
  {
    label: "Investigate",
    href: "/investigate",
    icon: FileSearch,
  },
  {
    label: "Evidence",
    href: "/evidence",
    icon: Archive,
  },
  {
    label: "Entities",
    href: "/entities",
    icon: Users,
  },
  {
    label: "Threat Intel",
    href: "/threat-intel",
    icon: Globe2,
  },
  {
    label: "MITRE ATT&CK",
    href: "/mitre",
    icon: Hexagon,
  },
  {
    label: "Response",
    href: "/response",
    icon: Zap,
  },
  {
    label: "Playbooks",
    href: "/playbooks",
    icon: BriefcaseBusiness,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BookOpen,
  },
];

export function InvestigationShell({
  children,
}: InvestigationShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbItems =
    pathname === "/dashboard"
      ? ["DASHBOARD"]
      : pathname === "/incidents"
        ? ["INCIDENTS"]
        : pathname === "/cases"
          ? ["CASES"]
          : pathname.startsWith("/cases/")
            ? ["CASES", pathname.split("/")[2] ?? "CASE"]
            : pathname === "/investigate"
              ? ["INVESTIGATE"]
              : pathname === "/evidence"
                ? ["EVIDENCE"]
                : pathname === "/entities"
                  ? ["ENTITIES"]
                  : pathname.startsWith("/threat-intel")
                    ? ["THREAT INTEL"]
                    : pathname.startsWith("/mitre")
                      ? ["MITRE ATT&CK"]
                      : pathname === "/response"
                        ? ["RESPONSE"]
                        : pathname === "/playbooks"
                          ? ["PLAYBOOKS"]
                          : pathname === "/reports"
                            ? ["REPORTS"]
                            : pathname === "/settings"
                              ? ["SETTINGS"]
                              : ["DASHBOARD"];

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeCase, setActiveCase] = useState<{
    id: string;
    title: string;
    riskScore: number;
  } | null>(null);

  const [liveCommandItems, setLiveCommandItems] = useState<
    Array<{
      id: string;
      label: string;
      meta: string;
      category: "event" | "entity" | "ioc" | "mitre";
      keywords?: string;
    }>
  >([]);

  useEffect(() => {
    const handleGlobalShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleGlobalShortcut);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcut);
    };
  }, []);

  const activeCaseId = pathname.match(/^\/cases\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    if (!activeCaseId) {
      return;
    }

    const caseId = decodeURIComponent(activeCaseId);
    let cancelled = false;

    async function loadActiveCase() {
      try {
        const response = await fetch(
          `/api/cases/${encodeURIComponent(caseId)}`,
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load active case.");
        }

        const data = (await response.json()) as {
          case?: {
            id: string;
            title: string;
            riskScore: number;
          };
        };

        if (!cancelled && data.case) {
          setActiveCase({
            id: data.case.id,
            title: data.case.title,
            riskScore: data.case.riskScore,
          });
        }
      } catch {
        if (!cancelled) {
          // Leave the current case unchanged when a background refresh fails.
        }
      }
    }

    void loadActiveCase();

    return () => {
      cancelled = true;
    };
  }, [activeCaseId]);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveSearchData() {
      try {
        const response = await fetch(
          "/api/wazuh/alerts?size=50",
          {
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Unable to load Wazuh search data.");
        }

        const data = (await response.json()) as {
          hits?: {
            hits?: Array<{
              _id?: string;
              _source?: {
                agent?: {
                  ip?: string;
                  name?: string;
                };
                data?: {
                  win?: {
                    eventdata?: {
                      image?: string;
                      originalFileName?: string;
                      user?: string;
                      commandLine?: string;
                    };
                  };
                };
                rule?: {
                  description?: string;
                  mitre?: {
                    technique?: string[];
                    id?: string[];
                    tactic?: string[];
                  };
                };
                id?: string;
                timestamp?: string;
                "@timestamp"?: string;
              };
            }>;
          };
        };

        const hits = data.hits?.hits ?? [];
        const items = new Map<string, {
          id: string;
          label: string;
          meta: string;
          category: "event" | "entity" | "ioc" | "mitre";
          keywords?: string;
        }>();

        for (const hit of hits) {
          const source = hit._source;
          if (!source) continue;

          const eventId = source.id ?? hit._id;
          const timestamp =
            source.timestamp ??
            source["@timestamp"] ??
            "Unknown time";

          const ruleDescription =
            source.rule?.description ??
            "Wazuh event";

          const endpoint =
            source.agent?.name ??
            "Unknown endpoint";

          const ip = source.agent?.ip;

          const eventLabel =
            ruleDescription;

          if (eventId) {
            items.set(`event:${eventId}`, {
              id: eventId,
              label: eventLabel,
              meta: `${endpoint} - ${timestamp}`,
              category: "event",
              keywords: [
                ruleDescription,
                source.data?.win?.eventdata?.commandLine ?? "",
                source.data?.win?.eventdata?.originalFileName ?? "",
              ].join(" "),
            });
          }

          if (endpoint !== "Unknown endpoint") {
            items.set(`entity:endpoint:${endpoint}`, {
              id: endpoint,
              label: endpoint,
              meta: `Endpoint - ${ip ?? "No IP"}`,
              category: "entity",
              keywords: "host endpoint agent windows workstation",
            });
          }

          const process =
            source.data?.win?.eventdata?.originalFileName ??
            source.data?.win?.eventdata?.image;

          if (process) {
            items.set(`entity:process:${process}`, {
              id: process,
              label: process,
              meta: `Process - ${endpoint}`,
              category: "entity",
              keywords: [
                "process",
                source.data?.win?.eventdata?.commandLine ?? "",
              ].join(" "),
            });
          }

          const user = source.data?.win?.eventdata?.user;

          if (user) {
            items.set(`entity:user:${user}`, {
              id: user,
              label: user,
              meta: `User - ${endpoint}`,
              category: "entity",
              keywords: "user account identity authentication",
            });
          }

          if (ip) {
            items.set(`ioc:ip:${ip}`, {
              id: ip,
              label: ip,
              meta: `IP - ${endpoint}`,
              category: "ioc",
              keywords: "ip network indicator address",
            });
          }

          const techniques =
            source.rule?.mitre?.technique ?? [];
          const techniqueIds =
            source.rule?.mitre?.id ?? [];

          techniques.forEach((technique, index) => {
            const techniqueId =
              techniqueIds[index] ?? technique;

            items.set(`mitre:${techniqueId}`, {
              id: techniqueId,
              label: `${techniqueId} - ${technique}`,
              meta: `MITRE ATT&CK - ${source.rule?.mitre?.tactic?.[index] ?? "Technique"}`,
              category: "mitre",
              keywords: [
                technique,
                source.rule?.mitre?.tactic?.[index] ?? "",
                ruleDescription,
              ].join(" "),
            });
          });
        }

        if (!cancelled) {
          setLiveCommandItems(Array.from(items.values()));
        }
      } catch {
        if (!cancelled) {
          setLiveCommandItems([]);
        }
      }
    }

    void loadLiveSearchData();

    return () => {
      cancelled = true;
    };
  }, []);

  const commandItems = [
    ...(activeCase
      ? [
          {
            id: activeCase.id,
            label: `${activeCase.id} - ${activeCase.title}`,
            meta: `Case - Risk ${activeCase.riskScore}`,
            category: "case" as const,
            keywords: "case incident investigation",
          },
        ]
      : []),
    ...liveCommandItems,
  ];

  const handleCommandSelect = (item: {
    id: string;
    label: string;
    meta: string;
    category: "case" | "event" | "entity" | "ioc" | "mitre";
    keywords?: string;
  }) => {
    setCommandOpen(false);

    if (item.category === "case") {
      router.push(`/cases/${item.id}`);
      return;
    }

    if (item.category === "event") {
      router.push("/investigate");
      window.setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("ir:search-select-event", {
            detail: { id: item.id },
          }),
        );
      }, 0);
      return;
    }

    if (item.category === "entity") {
      router.push(`/entities?search=${encodeURIComponent(item.id)}`);
      return;
    }

    if (item.category === "ioc") {
      router.push(`/threat-intel?indicator=${encodeURIComponent(item.id)}`);
      return;
    }

    if (item.category === "mitre") {
      router.push(`/mitre?technique=${encodeURIComponent(item.id)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080C] text-[#F5F7FA]">
      <CommandPalette
        open={commandOpen}
        items={commandItems}
        onClose={() => setCommandOpen(false)}
        onSelect={handleCommandSelect}
      />
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <div className="flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#263441] bg-[#06080C] transition-all duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "w-[74px]" : "w-[244px]"}`}
        >
          <div
            className={`flex h-[64px] items-center border-b border-[#263441] ${
              collapsed ? "justify-center px-2" : "gap-3 px-4"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#4F8CFF]/30 bg-[#4F8CFF]/[0.06]">
              <ShieldCheck className="h-4 w-4 text-[#4F8CFF]" />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="text-[14px] font-semibold tracking-[0.12em]">
                  IR LAB
                </div>
                <div className="mt-0.5 text-[10px] tracking-[0.12em] text-[#69727E]">
                  INCIDENT INVESTIGATION
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              className="ml-auto hidden rounded-md p-1.5 text-[#59616D] transition hover:bg-white/[0.04] hover:text-white lg:block"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <ChevronRight className="h-3.5 w-3.5" />
              ) : (
                <ChevronLeft className="h-3.5 w-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto rounded-md p-1.5 text-[#59616D] hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2.5 py-4">
            <div className="mb-2 px-2 text-[11px] font-semibold tracking-[0.15em] text-[#464D56]">
              {!collapsed && "WORKSPACE"}
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href === "/cases" && pathname.startsWith("/cases/"));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex w-full items-center rounded-lg border transition ${
                      collapsed
                        ? "justify-center px-2 py-2.5"
                        : "gap-3 px-3 py-2.5"
                    } ${
                      active
                        ? "border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.07] text-white"
                        : "border-transparent text-[#8B93A1] hover:bg-white/[0.035] hover:text-white"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active
                          ? "text-[#4F8CFF]"
                          : "text-[#69727E] group-hover:text-[#A7AFBA]"
                      }`}
                    />

                    {!collapsed && (
                      <span className="text-[12px]">{item.label}</span>
                    )}

                    {!collapsed && item.label === "Incidents" && (
                      <span className="ml-auto rounded-md bg-[#FF5364]/[0.08] px-1.5 py-0.5 text-[10px] text-[#FF5364]">
                        08
                      </span>
                    )}

                    {!collapsed && item.label === "Cases" && (
                      <span className="ml-auto rounded-md bg-[#4F8CFF]/[0.08] px-1.5 py-0.5 text-[10px] text-[#4F8CFF]">
                        12
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-6 border-t border-[#263441] pt-5">
              <div className="mb-2 px-2 text-[11px] font-semibold tracking-[0.15em] text-[#464D56]">
                {!collapsed && "SYSTEM"}
              </div>

              <div className="relative">
                <button
                  type="button"
                  title={collapsed ? "Settings" : undefined}
                  onClick={() => {
                    setSettingsOpen((current) => !current);
                    setNotificationsOpen(false);
                    setFiltersOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg border border-transparent text-[#7E8794] transition hover:bg-white/[0.025] hover:text-white ${
                    collapsed
                      ? "justify-center px-2 py-2.5"
                      : "gap-3 px-3 py-2.5"
                  }`}
                  aria-expanded={settingsOpen}
                >
                  <Settings className="h-4 w-4 shrink-0 text-[#69727E]" />
                  {!collapsed && <span className="text-[12px]">Settings</span>}
                </button>

                {settingsOpen && !collapsed && (
                  <div className="absolute bottom-12 left-0 z-50 w-[260px] rounded-xl border border-[#263441] bg-[#0D131A] p-3 shadow-2xl">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A7AFBA]">
                      Settings
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-[#1B2430] px-3 py-2.5">
                        <span className="text-[10px] text-[#A7AFBA]">
                          Console density
                        </span>
                        <span className="text-[9px] text-[#4DD7E8]">
                          Compact
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-[#1B2430] px-3 py-2.5">
                        <span className="text-[10px] text-[#A7AFBA]">
                          Motion
                        </span>
                        <span className="text-[9px] text-[#43D39E]">
                          Enabled
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-[#263441] p-3">
            {collapsed ? (
              <div className="flex justify-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#263441] bg-[#0B0E12] text-[10px] text-[#4F8CFF]">
                  AP
                </div>
              </div>
            ) : activeCase ? (
              <Link
                href={`/cases/${encodeURIComponent(activeCase.id)}`}
                onClick={() => setMobileOpen(false)}
                className="group block rounded-xl border border-[#263441] bg-[#0B0E12] p-3 transition hover:border-[#4F8CFF]/25 hover:bg-[#0D1218]"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.1em] text-[#69727E]">
                    ACTIVE CASE
                  </span>

                  <span className="flex items-center gap-1 text-[10px] text-[#35D6A1]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#35D6A1]" />
                    LIVE
                  </span>
                </div>

                <div className="font-mono text-[15px] font-semibold tracking-tight text-[#E7ECF2]">
                  {activeCase.id}
                </div>

                <div className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#9AA6B2]">
                  {activeCase.title}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[#263441] pt-3">
                  <span className="text-[10px] text-[#69727E]">
                    Risk
                  </span>

                  <span className="text-[13px] font-semibold text-[#FF4D67] transition group-hover:text-[#FF657B]">
                    {activeCase.riskScore} / 100
                  </span>
                </div>
              </Link>
            ) : (
              <div className="rounded-xl border border-[#263441] bg-[#0B0E12] p-3">
                <div className="text-[10px] font-medium tracking-[0.1em] text-[#69727E]">
                  ACTIVE CASE
                </div>

                <div className="mt-2 text-[11px] text-[#596674]">
                  No active case selected.
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[64px] items-center border-b border-[#263441] bg-[#06080C]/95 px-4 backdrop-blur-xl sm:px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="mr-3 rounded-lg p-2 text-[#69727E] hover:text-white lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </button>

            <div className="hidden items-center gap-2 md:flex">
              <span className="text-[10px] font-medium tracking-[0.12em] text-[#66717D]">
                IR LAB
              </span>

              {breadcrumbItems.map((item, index) => (
                <div
                  key={`${item}-${index}`}
                  className="flex items-center gap-2"
                >
                  <ChevronRight className="h-3 w-3 text-[#30343B]" />

                  <span
                    className={`text-[10px] font-medium tracking-[0.12em] ${
                      index === breadcrumbItems.length - 1
                        ? "text-[#5B8CFF]"
                        : "text-[#66717D]"
                    }`}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="flex h-9 w-[250px] items-center gap-2 rounded-lg border border-[#263441] bg-[#101720] px-3 text-left transition hover:border-[#4F8CFF]/30 hover:bg-[#17212B] md:flex"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-[#59616D]" />
                <span className="truncate text-[11px] text-[#59616D]">
                  Search cases, entities, evidence...
                </span>

                <kbd className="ml-auto rounded border border-[#263441] px-1.5 py-0.5 text-[10px] text-[#59616D]">
                  Ctrl K
                </kbd>
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsOpen((current) => !current);
                    setFiltersOpen(false);
                    setSettingsOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[#69727E] transition hover:text-white ${
                    notificationsOpen
                      ? "border-[#4F8CFF]/30 bg-[#4F8CFF]/[0.05] text-[#4F8CFF]"
                      : "border-[#263441] hover:border-[#2A313A]"
                  }`}
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                >
                  <Bell className="h-4 w-4" />
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 top-11 z-50 w-[300px] rounded-xl border border-[#263441] bg-[#0D131A] p-3 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A7AFBA]">
                        Notifications
                      </div>
                      <span className="text-[9px] text-[#59616D]">2 new</span>
                    </div>

                    <div className="mt-3 space-y-1">
                      <div className="rounded-lg bg-white/[0.018] px-3 py-2.5">
                        <div className="text-[10px] text-[#D9DEE7]">
                          Critical event selected
                        </div>
                        <div className="mt-0.5 text-[9px] text-[#66717D]">
                          Credential dumping activity requires review.
                        </div>
                      </div>

                      <div className="rounded-lg bg-white/[0.018] px-3 py-2.5">
                        <div className="text-[10px] text-[#D9DEE7]">
                          Response action ready
                        </div>
                        <div className="mt-0.5 text-[9px] text-[#66717D]">
                          Containment actions are available for this case.
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setFiltersOpen((current) => !current);
                    setNotificationsOpen(false);
                    setSettingsOpen(false);
                  }}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[#69727E] transition hover:text-white ${
                    filtersOpen
                      ? "border-[#4F8CFF]/30 bg-[#4F8CFF]/[0.05] text-[#4F8CFF]"
                      : "border-[#263441] hover:border-[#2A313A]"
                  }`}
                  aria-label="Filters"
                  aria-expanded={filtersOpen}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>

                {filtersOpen && (
                  <div className="absolute right-0 top-11 z-50 w-[260px] rounded-xl border border-[#263441] bg-[#0D131A] p-3 shadow-2xl">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A7AFBA]">
                      Investigation Filters
                    </div>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between rounded-lg border border-[#1B2430] px-3 py-2.5">
                        <span className="text-[10px] text-[#A7AFBA]">
                          Severity
                        </span>
                        <span className="text-[9px] font-medium text-[#FF4D67]">
                          Critical+
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-[#1B2430] px-3 py-2.5">
                        <span className="text-[10px] text-[#A7AFBA]">
                          Status
                        </span>
                        <span className="text-[9px] font-medium text-[#43D39E]">
                          Active
                        </span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg border border-[#1B2430] px-3 py-2.5">
                        <span className="text-[10px] text-[#A7AFBA]">
                          Source
                        </span>
                        <span className="text-[9px] font-medium text-[#4DD7E8]">
                          All
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="hidden h-9 items-center gap-2 rounded-lg border border-[#263441] px-2.5 sm:flex">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1677FF]/[0.08] text-[10px] font-semibold text-[#4F8CFF]">
                  AP
                </div>

                <div>
                  <div className="text-[11px] text-[#D9DEE7]">
                    Anshuman Pandey
                  </div>
                  <div className="text-[9px] text-[#59616D]">
                    Analyst
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1720px] p-4 sm:p-5 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
