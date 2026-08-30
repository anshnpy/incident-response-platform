import { NavigationRoute } from "@/components/ir/NavigationRoute";

interface MitrePageProps {
  searchParams: Promise<{ technique?: string }>;
}

export default async function Page({
  searchParams,
}: MitrePageProps) {
  const { technique } = await searchParams;
  const selectedTechnique = technique?.trim() || null;

  return (
    <NavigationRoute
      eyebrow="Detection Mapping"
      title="MITRE ATT&CK"
      description="Explore techniques, tactics, and observed adversary behavior."
    >
      <div className="space-y-4">
        {selectedTechnique ? (
          <div className="rounded-xl border border-[#7C6CFF]/25 bg-[#7C6CFF]/[0.045] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8B82FF]">
              Selected technique
            </div>

            <div className="mt-2 font-mono text-[16px] font-semibold text-[#E7ECF2]">
              {selectedTechnique}
            </div>

            <div className="mt-1 text-[10px] text-[#69727E]">
              Opened from global search.
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1B2430] bg-[#101720] p-4 text-[10px] text-[#69727E]">
            Select a technique to inspect its ATT&CK context.
          </div>
        )}
      </div>
    </NavigationRoute>
  );
}
