import { ShieldCheck, SlidersHorizontal } from "lucide-react";

import { NavigationRoute } from "@/components/ir/NavigationRoute";
import { SettingsPanel } from "@/components/ir/SettingsPanel";

export default function Page() {
  return (
    <NavigationRoute
      eyebrow="System"
      title="Settings"
      description="Configure analyst workspace and platform preferences."
    >
      <div className="space-y-4">
        <section className="rounded-xl border border-[#263441] bg-[#101720] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#35D6A1]/15 bg-[#35D6A1]/[0.04]">
              <ShieldCheck className="h-4 w-4 text-[#35D6A1]" />
            </div>

            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                Platform Status
              </div>

              <div className="mt-1 text-[12px] font-medium text-[#D9DEE7]">
                Workspace operational
              </div>

              <div className="mt-1 text-[9px] text-[#69727E]">
                Preferences are stored locally in this analyst workspace.
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#263441] bg-[#101720]">
          <div className="border-b border-[#263441]/70 px-4 py-3.5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#4F8CFF]" />

              <div>
                <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#59616D]">
                  Analyst Preferences
                </div>

                <div className="mt-1 text-[10px] text-[#69727E]">
                  Control investigation workspace behavior.
                </div>
              </div>
            </div>
          </div>

          <SettingsPanel />
        </section>
      </div>
    </NavigationRoute>
  );
}
