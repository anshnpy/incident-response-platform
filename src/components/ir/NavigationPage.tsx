import type { ReactNode } from "react";

interface NavigationPageProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function NavigationPage({
  eyebrow,
  title,
  description,
  children,
}: NavigationPageProps) {
  return (
    <section className="rounded-2xl border border-[#263441] bg-[#0B1016]">
      <div className="border-b border-[#263441] px-5 py-5 sm:px-6">
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#59616D]">
          {eyebrow}
        </div>

        <h1 className="mt-2 text-[24px] font-semibold tracking-tight text-[#E7ECF2]">
          {title}
        </h1>

        <p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-[#7E8794]">
          {description}
        </p>
      </div>

      <div className="p-5 sm:p-6">
        {children ?? (
          <div className="rounded-xl border border-[#1B2430] bg-[#101720] px-4 py-8 text-center">
            <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
              Workspace ready
            </div>

            <div className="mt-2 text-[11px] text-[#8B93A1]">
              This module is ready for its investigation data source.
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
