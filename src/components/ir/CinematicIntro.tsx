"use client";

import { useEffect, useState } from "react";

const STEPS = [
  ["SECURE CHANNEL", "INITIALIZING"],
  ["TELEMETRY BUS", "CONNECTING"],
  ["WAZUH SENSOR", "CONNECTED"],
  ["INCIDENT ENGINE", "ONLINE"],
  ["INVESTIGATION CORE", "ONLINE"],
  ["MITRE MAPPING", "READY"],
  ["RESPONSE PIPELINE", "READY"],
] as const;

export function CinematicIntro() {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 7350);

    const endTimer = window.setTimeout(() => {
      setVisible(false);
    }, 9000);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(endTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes ir-step-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        @keyframes ir-brand-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 14px, 0) scale(0.992);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        @keyframes ir-access-in {
          0% {
            opacity: 0;
            transform: translate3d(0, 8px, 0);
          }

          100% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }

        .ir-step {
          opacity: 0;
          animation: ir-step-in 500ms cubic-bezier(0.22, 1, 0.36, 1) both;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .ir-step:nth-child(1) {
          animation-delay: 250ms;
        }

        .ir-step:nth-child(2) {
          animation-delay: 850ms;
        }

        .ir-step:nth-child(3) {
          animation-delay: 1450ms;
        }

        .ir-step:nth-child(4) {
          animation-delay: 2050ms;
        }

        .ir-step:nth-child(5) {
          animation-delay: 2650ms;
        }

        .ir-step:nth-child(6) {
          animation-delay: 3250ms;
        }

        .ir-step:nth-child(7) {
          animation-delay: 3850ms;
        }

        .ir-brand {
          opacity: 0;
          animation: ir-brand-in 900ms cubic-bezier(0.22, 1, 0.36, 1) 4.9s both;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .ir-access {
          opacity: 0;
          animation: ir-access-in 600ms cubic-bezier(0.22, 1, 0.36, 1) 6.35s both;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .ir-shell {
          transform: translate3d(0, 0, 0);
          transition:
            opacity 900ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 900ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, opacity;
          backface-visibility: hidden;
        }

        .ir-shell[data-exiting="true"] {
          opacity: 0;
          transform: translate3d(0, -8px, 0);
        }

        @media (prefers-reduced-motion: reduce) {
          .ir-step,
          .ir-brand,
          .ir-access {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .ir-shell {
            transition: opacity 300ms ease;
          }

          .ir-shell[data-exiting="true"] {
            transform: none;
          }
        }
      `}</style>

      <div
        data-exiting={exiting}
        className="ir-shell fixed inset-0 z-[9999] overflow-hidden bg-black text-[#E7ECF2]"
      >
        <div className="absolute left-[9%] top-[17%] h-px w-[82%] bg-white/[0.045]" />
        <div className="absolute bottom-[18%] left-[13%] h-px w-[74%] bg-white/[0.035]" />
        <div className="absolute left-[10%] top-1/2 h-24 w-px -translate-y-1/2 bg-[#4F8CFF]/10" />
        <div className="absolute right-[10%] top-1/2 h-24 w-px -translate-y-1/2 bg-[#4F8CFF]/10" />

        <div className="relative flex h-full items-center justify-center px-6">
          <div className="w-full max-w-4xl">
            <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-[#515B66]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4F8CFF] shadow-[0_0_9px_rgba(79,140,255,0.45)]" />
              SECURE ENVIRONMENT
              <span className="text-[#303740]">/</span>
              ANALYST CONSOLE
            </div>

            <div className="max-w-2xl space-y-3 font-mono text-[11px] sm:text-[12px]">
              {STEPS.map(([label, status], index) => (
                <div
                  key={label}
                  className="ir-step flex items-center gap-3"
                >
                  <span className="w-5 text-[#4F8CFF]/65">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="flex-1 text-[#737E89]">
                    {label}
                  </span>

                  <span className="hidden flex-1 border-t border-dashed border-white/[0.055] sm:block" />

                  <span className="min-w-[100px] text-right tracking-[0.08em] text-[#D5DEE8]">
                    <span className="mr-2 text-[#4F8CFF]">●</span>
                    {status}
                  </span>
                </div>
              ))}
            </div>

            <div className="ir-brand mt-12">
              <div className="text-[clamp(2.35rem,7vw,5.7rem)] font-medium leading-[0.9] tracking-[-0.055em] text-[#F1F3F5]">
                INCIDENT RESPONSE
                <br />
                <span className="text-[#6C98E4]">PLATFORM</span>
              </div>

              <div className="mt-5 font-mono text-[10px] tracking-[0.38em] text-[#737E89] sm:text-xs">
                DETECT. INVESTIGATE. RESPOND.
              </div>
            </div>

            <div className="ir-access mt-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em]">
              <span className="h-px w-10 bg-[#4F8CFF]/45" />
              <span className="text-[#A9BACB]">ACCESS GRANTED</span>
              <span className="text-[#4F8CFF]">›</span>
              <span className="text-[#4F8CFF]/65">COMMAND CENTER</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
