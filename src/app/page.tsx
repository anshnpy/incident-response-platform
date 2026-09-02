"use client";

import { useCallback, useState } from "react";
import { CinematicIntro } from "@/components/ir/CinematicIntro";
import { SocCommandCenter } from "@/components/ir/SocCommandCenter";
import { InvestigationShell } from "@/components/ir/InvestigationShell";

export default function Home() {
  const [introComplete, setIntroComplete] = useState(false);

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <>
      <CinematicIntro onComplete={handleIntroComplete} />

      {introComplete && (
        <div className="animate-[ir-command-reveal_360ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <InvestigationShell>
            <SocCommandCenter />
          </InvestigationShell>
        </div>
      )}

      <style jsx global>{`
        @keyframes ir-command-reveal {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }

          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </>
  );
}
