import Link from "next/link";
import { ArrowUpRight, Network, Server, Terminal, UserRound } from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";

const entities = [
  ["j.smith", "User", "Suspicious", UserRound],
  ["WIN-10-23-17", "Endpoint", "Investigated", Server],
  ["mimikatz.exe", "Process", "Malicious", Terminal],
  ["185.199.109.153", "IP Address", "Malicious", Network],
];

export default function Page() {
  return (
    <NavigationRoute
      eyebrow="Entity Intelligence"
      title="Entities"
      description="Explore users, endpoints, processes, addresses, and other investigation entities."
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {entities.map(([name, type, status, Icon]) => {
          const EntityIcon = Icon as typeof Network;
          const href =
            type === "IP Address"
              ? `/threat-intel?indicator=${encodeURIComponent(String(name))}`
              : `/entities?search=${encodeURIComponent(String(name))}`;

          return (
            <Link
              key={String(name)}
              href={href}
              className="group flex items-center gap-3 rounded-xl border border-[#263441] bg-[#101720] p-4 transition hover:border-[#4F8CFF]/25 hover:bg-[#131A22]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#4F8CFF]/15 bg-[#4F8CFF]/[0.04]">
                <EntityIcon className="h-3.5 w-3.5 text-[#4F8CFF]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-[11px] text-[#D9DEE7]">
                  {String(name)}
                </div>

                <div className="mt-1 text-[9px] text-[#59616D]">
                  {String(type)} &middot; {String(status)}
                </div>
              </div>

              <ArrowUpRight className="h-3.5 w-3.5 text-[#59616D] transition group-hover:text-[#4F8CFF]" />
            </Link>
          );
        })}
      </div>
    </NavigationRoute>
  );
}
