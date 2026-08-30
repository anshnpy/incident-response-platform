"use client";

type FindingStatus = "draft" | "review" | "confirmed";

interface FindingStatusBadgeProps {
  status: FindingStatus;
}

const styles: Record<
  FindingStatus,
  {
    label: string;
    className: string;
    dot: string;
  }
> = {
  draft: {
    label: "Draft",
    className:
      "border-[#3A4652] bg-[#17212B] text-[#A7AFBA]",
    dot: "bg-[#8B93A1]",
  },
  review: {
    label: "In Review",
    className:
      "border-[#FFB84D]/25 bg-[#FFB84D]/[0.05] text-[#FFB84D]",
    dot: "bg-[#FFB84D]",
  },
  confirmed: {
    label: "Confirmed",
    className:
      "border-[#35D6A1]/25 bg-[#35D6A1]/[0.05] text-[#35D6A1]",
    dot: "bg-[#35D6A1]",
  },
};

export function FindingStatusBadge({
  status,
}: FindingStatusBadgeProps) {
  const style = styles[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[8px] font-medium uppercase tracking-[0.08em] ${style.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
      />
      {style.label}
    </span>
  );
}
