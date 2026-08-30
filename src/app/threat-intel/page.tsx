import { NavigationRoute } from "@/components/ir/NavigationRoute";

interface ThreatIntelPageProps {
  searchParams: Promise<{ indicator?: string }>;
}

export default async function Page({
  searchParams,
}: ThreatIntelPageProps) {
  const { indicator } = await searchParams;
  const selectedIndicator = indicator?.trim() || null;

  return (
    <NavigationRoute
      eyebrow="Threat Intelligence"
      title="Threat Intel"
      description="Correlate indicators with reputation and contextual threat intelligence."
    >
      <div className="space-y-4">
        {selectedIndicator ? (
          <div className="rounded-xl border border-[#FF5364]/20 bg-[#FF5364]/[0.04] p-4">
            <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#FF5364]">
              Selected indicator
            </div>

            <div className="mt-2 font-mono text-[16px] font-semibold text-[#E7ECF2]">
              {selectedIndicator}
            </div>

            <div className="mt-1 text-[10px] text-[#69727E]">
              Opened from global search.
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#1B2430] bg-[#101720] p-4 text-[10px] text-[#69727E]">
            Search or select an indicator to inspect its reputation and context.
          </div>
        )}
      </div>
    </NavigationRoute>
  );
}
