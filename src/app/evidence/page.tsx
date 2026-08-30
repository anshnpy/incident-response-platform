import Link from "next/link";
import { FileSearch } from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

const evidence = [
  ["mimikatz.exe", "Process Artifact", "IR-2048", "Malicious"],
  ["memory_dump.raw", "Memory Image", "IR-2048", "Collected"],
  ["LSASS_access.evtx", "Windows Event Log", "IR-2048", "Collected"],
  ["auth_events.evtx", "Authentication Log", "IR-2048", "Reviewed"],
];

export default function Page() {
  return (
    <NavigationRoute
      eyebrow="Forensics"
      title="Evidence"
      description="Review collected forensic artifacts and their chain-of-custody context."
    >
      <div className="overflow-hidden rounded-xl border border-[#263441] bg-[#101720]">
        <div className="grid grid-cols-[minmax(0,1.7fr)_170px_110px_110px] border-b border-[#263441] px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
          <span>Artifact</span>
          <span>Type</span>
          <span>Case</span>
          <span>Status</span>
        </div>

        <div className="divide-y divide-[#263441]">
          {evidence.map(([name, type, caseId, status]) => (
            <Link
              key={name}
              href={`/cases/${caseId}`}
              className="group grid grid-cols-[minmax(0,1.7fr)_170px_110px_110px] items-center gap-2 px-4 py-3 transition hover:bg-white/[0.018]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[#35D6FF]/15 bg-[#35D6FF]/[0.04]">
                  <FileSearch className="h-3.5 w-3.5 text-[#35D6FF]" />
                </div>

                <div className="min-w-0">
                  <div className="truncate font-mono text-[10px] text-[#D9DEE7]">
                    {name}
                  </div>

                  <div className="mt-0.5 text-[9px] text-[#59616D]">
                    Forensic artifact
                  </div>
                </div>
              </div>

              <span className="truncate text-[9px] text-[#8B93A1]">
                {type}
              </span>

              <span className="font-mono text-[9px] text-[#69727E]">
                {caseId}
              </span>

              <span className="text-[9px] font-medium uppercase text-[#35D6A1]">
                {status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </NavigationRoute>
  );
}
