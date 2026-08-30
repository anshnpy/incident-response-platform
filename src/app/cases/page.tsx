import Link from "next/link";

import { InvestigationShell } from "@/components/ir/InvestigationShell";
import { incidents } from "@/data/incidents";

export default function CasesPage() {
  return (
    <InvestigationShell>
      <section className="overflow-hidden rounded-2xl border border-[#263441] bg-[#0B1016]">
        <div className="border-b border-[#263441] px-5 py-5 sm:px-6">
          <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
            Investigation
          </div>

          <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-[#E7ECF2]">
            Cases
          </h1>

          <p className="mt-1.5 text-[11px] leading-5 text-[#7E8794]">
            Active investigations and analyst-owned response cases.
          </p>
        </div>

        <div className="divide-y divide-[#263441]">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/cases/${incident.id}`}
              className="group flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.018]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] text-[#8B93A1]">
                    {incident.id}
                  </span>

                  <span className="rounded-md border border-[#FF5364]/20 bg-[#FF5364]/[0.06] px-2 py-1 text-[9px] font-semibold uppercase text-[#FF5364]">
                    {incident.severity}
                  </span>

                  <span className="rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] px-2 py-1 text-[9px] font-medium uppercase text-[#35D6A1]">
                    {incident.status}
                  </span>
                </div>

                <div className="mt-2 text-[13px] font-semibold text-[#E7ECF2]">
                  {incident.title}
                </div>

                <div className="mt-1 text-[10px] text-[#69727E]">
                  {incident.affectedUser} &middot; {incident.affectedEndpoint} &middot; Risk {incident.riskScore}/100
                </div>
              </div>

              <span className="shrink-0 text-[10px] text-[#4F8CFF] transition group-hover:text-[#62AEFF]">
                Open case &rarr;
              </span>
            </Link>
          ))}
        </div>
      </section>
    </InvestigationShell>
  );
}
