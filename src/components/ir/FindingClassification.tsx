"use client";

type Severity = "low" | "medium" | "high" | "critical";
type Confidence = "low" | "medium" | "high";

interface FindingClassificationProps {
  severity: Severity;
  confidence: Confidence;
  onSeverityChange: (value: Severity) => void;
  onConfidenceChange: (value: Confidence) => void;
}

const severityOptions: {
  value: Severity;
  description: string;
  active: string;
  dot: string;
}[] = [
  {
    value: "low",
    description: "Limited impact",
    active: "border-[#35D6A1]/30 bg-[#35D6A1]/[0.07] text-[#35D6A1]",
    dot: "bg-[#35D6A1]",
  },
  {
    value: "medium",
    description: "Requires attention",
    active: "border-[#4F8CFF]/30 bg-[#4F8CFF]/[0.07] text-[#4F8CFF]",
    dot: "bg-[#4F8CFF]",
  },
  {
    value: "high",
    description: "Significant risk",
    active: "border-[#FFB84D]/30 bg-[#FFB84D]/[0.07] text-[#FFB84D]",
    dot: "bg-[#FFB84D]",
  },
  {
    value: "critical",
    description: "Immediate response",
    active: "border-[#FF5364]/30 bg-[#FF5364]/[0.07] text-[#FF5364]",
    dot: "bg-[#FF5364]",
  },
];

const confidenceOptions: {
  value: Confidence;
  description: string;
  active: string;
}[] = [
  {
    value: "low",
    description: "Limited evidence",
    active: "border-[#FFB84D]/30 bg-[#FFB84D]/[0.06] text-[#FFB84D]",
  },
  {
    value: "medium",
    description: "Supporting evidence",
    active: "border-[#4F8CFF]/30 bg-[#4F8CFF]/[0.06] text-[#4F8CFF]",
  },
  {
    value: "high",
    description: "Strong evidence",
    active: "border-[#35D6A1]/30 bg-[#35D6A1]/[0.06] text-[#35D6A1]",
  },
];

export function FindingClassification({
  severity,
  confidence,
  onSeverityChange,
  onConfidenceChange,
}: FindingClassificationProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
          Severity
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {severityOptions.map((option) => {
            const selected = severity === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSeverityChange(option.value)}
                aria-pressed={selected}
                className={`rounded-lg border px-2.5 py-2.5 text-left transition ${
                  selected
                    ? option.active
                    : "border-[#263441] bg-[#101720] text-[#69727E] hover:border-[#3A4652] hover:text-[#A7AFBA]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      selected ? option.dot : "bg-[#3A4652]"
                    }`}
                  />

                  <span className="text-[10px] font-medium uppercase">
                    {option.value}
                  </span>
                </div>

                <div className="mt-1 text-[8px] leading-3.5 text-current/60">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
          Confidence
        </div>

        <div className="grid grid-cols-3 gap-2">
          {confidenceOptions.map((option) => {
            const selected = confidence === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onConfidenceChange(option.value)}
                aria-pressed={selected}
                className={`rounded-lg border px-2.5 py-2.5 text-left transition ${
                  selected
                    ? option.active
                    : "border-[#263441] bg-[#101720] text-[#69727E] hover:border-[#3A4652] hover:text-[#A7AFBA]"
                }`}
              >
                <div className="text-[10px] font-medium uppercase">
                  {option.value}
                </div>

                <div className="mt-1 text-[8px] leading-3.5 text-current/60">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
