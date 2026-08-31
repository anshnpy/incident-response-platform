"use client";

import { Clock3, History, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

interface IncidentActivity {
  id: string;
  incidentId: string;
  actor: string;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  detail: string | null;
  createdAt: string;
}

export function IncidentActivityPanel({
  incidentId,
}: {
  incidentId: string;
}) {
  const [activity, setActivity] = useState<IncidentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadActivity() {
      try {
        const response = await fetch(
          `/api/incidents/${encodeURIComponent(incidentId)}/activity`,
          {
            cache: "no-store",
          },
        );

        const data = (await response.json()) as {
          activity?: IncidentActivity[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load incident activity.");
        }

        if (!cancelled) {
          setActivity(Array.isArray(data.activity) ? data.activity : []);
          setError(null);
          setLoading(false);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load incident activity.",
          );
          setLoading(false);
        }
      }
    }

    void loadActivity();

    return () => {
      cancelled = true;
    };
  }, [incidentId]);

  return (
    <section className="rounded-xl border border-[#263441] bg-[#101720]">
      <div className="flex items-center justify-between border-b border-[#263441]/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <History className="h-4 w-4 text-[#4DD7E8]" />

          <div>
            <h3 className="text-[12px] font-semibold text-[#E7ECF2]">
              Activity History
            </h3>

            <p className="mt-0.5 text-[9px] text-[#66717D]">
              Analyst changes recorded for this incident
            </p>
          </div>
        </div>

        {!loading && (
          <span className="font-mono text-[9px] text-[#66717D]">
            {activity.length}{" "}
            {activity.length === 1 ? "event" : "events"}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 px-4 py-5 text-[10px] text-[#69727E]">
          <Clock3 className="h-3.5 w-3.5 animate-spin" />
          Loading activity...
        </div>
      ) : error ? (
        <div className="m-4 rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.05] px-3 py-3 text-[9px] text-[#FF8A96]">
          {error}
        </div>
      ) : activity.length === 0 ? (
        <div className="m-4 rounded-lg border border-[#1B2430] bg-[#10151C] px-3 py-4 text-[10px] text-[#66717D]">
          No analyst activity recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-[#263441]/70">
          {activity.map((item) => (
            <div key={item.id} className="px-4 py-3.5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#263441] bg-[#0B1016]">
                  <UserRound className="h-3.5 w-3.5 text-[#69727E]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-medium text-[#D7DDE5]">
                      {item.actor}
                    </span>

                    <span className="text-[9px] uppercase tracking-[0.06em] text-[#43D39E]">
                      {item.action}
                    </span>

                    <span className="ml-auto font-mono text-[8px] text-[#596674]">
                      {new Date(item.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="mt-1 text-[9px] uppercase tracking-[0.06em] text-[#59616D]">
                    {item.field ?? "incident"}
                  </div>

                  {item.field &&
                  item.oldValue !== null &&
                  item.newValue !== null &&
                  item.oldValue !== item.newValue ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[9px]">
                      <span className="rounded-md border border-[#263441] bg-[#0B1016] px-2 py-1 font-mono text-[#69727E]">
                        {item.oldValue}
                      </span>

                      <span className="text-[#596674]">?</span>

                      <span className="rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.04] px-2 py-1 font-mono text-[#A7AFBA]">
                        {item.newValue}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[9px] leading-4 text-[#69727E]">
                      {item.detail ?? "Incident activity recorded."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
