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
  const [step, setStep] = useState(-1);
  const [brand, setBrand] = useState(false);
  const [granted, setGranted] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const stepTimers = STEPS.map((_, index) =>
      window.setTimeout(() => {
        setStep(index);
      }, 500 + index * 600),
    );

    const brandTimer = window.setTimeout(() => {
      setBrand(true);
    }, 5100);

    const grantTimer = window.setTimeout(() => {
      setGranted(true);
    }, 6500);

    const exitTimer = window.setTimeout(() => {
      setExiting(true);
    }, 7350);

    const endTimer = window.setTimeout(() => {
      setVisible(false);
    }, 9000);

    return () => {
      stepTimers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(brandTimer);
      window.clearTimeout(grantTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(endTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-black text-[#E7ECF2] transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        exiting ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute left-[9%] top-[17%] h-px w-[82%] bg-white/[0.045]" />

      <div className="absolute bottom-[18%] left-[13%] h-px w-[74%] bg-white/[0.035]" />

      <div className="absolute left-[10%] top-1/2 h-24 w-px -translate-y-1/2 bg-[#4F8CFF]/10" />

      <div className="absolute right-[10%] top-1/2 h-24 w-px -translate-y-1/2 bg-[#4F8CFF]/10" />

      <div className="relative flex h-full items-center justify-center px-6">
        <div
          className={`w-full max-w-4xl transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            exiting
              ? "translate-y-[-10px] scale-[1.015] opacity-0 blur-[5px]"
              : "translate-y-0 scale-100 opacity-100 blur-0"
          }`}
        >
          <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-[#515B66]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#4F8CFF] shadow-[0_0_9px_rgba(79,140,255,0.45)]" />
            SECURE ENVIRONMENT
            <span className="text-[#303740]">/</span>
            ANALYST CONSOLE
          </div>

          <div className="max-w-2xl space-y-3 font-mono text-[11px] sm:text-[12px]">
            {STEPS.slice(0, step + 1).map(([label, status], index) => (
              <div
                key={label}
                className="flex items-center gap-3 transition-all duration-500"
              >
                <span className="w-5 text-[#4F8CFF]/65">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="flex-1 text-[#737E89]">{label}</span>

                <span className="hidden flex-1 border-t border-dashed border-white/[0.055] sm:block" />

                <span className="min-w-[100px] text-right tracking-[0.08em] text-[#D5DEE8]">
                  <span className="mr-2 text-[#4F8CFF]">●</span>
                  {status}
                </span>
              </div>
            ))}
          </div>

          <div
            className={`mt-12 transform transition-all duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              brand
                ? "translate-y-0 scale-100 opacity-100 blur-0"
                : "translate-y-6 scale-[0.985] opacity-0 blur-md"
            }`}
          >
            <div className="text-[clamp(2.35rem,7vw,5.7rem)] font-medium leading-[0.9] tracking-[-0.055em] text-[#F1F3F5]">
              INCIDENT RESPONSE
              <br />
              <span className="text-[#6C98E4]">PLATFORM</span>
            </div>

            <div className="mt-5 font-mono text-[10px] tracking-[0.38em] text-[#737E89] sm:text-xs">
              DETECT. INVESTIGATE. RESPOND.
            </div>
          </div>

          <div
            className={`mt-8 flex items-center gap-3 font-mono text-[10px] tracking-[0.2em] transition-all duration-700 ${
              granted
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0"
            }`}
          >
            <span className="h-px w-10 bg-[#4F8CFF]/45" />
            <span className="text-[#A9BACB]">ACCESS GRANTED</span>
            <span className="text-[#4F8CFF]">›</span>
            <span className="text-[#4F8CFF]/65">COMMAND CENTER</span>
          </div>
        </div>
      </div>
    </div>
  );
}
