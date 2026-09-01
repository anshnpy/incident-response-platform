"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface CaseFiltersProps {
  statuses: string[];
  severities: string[];
}

export function CaseFilters({
  statuses,
  severities,
}: CaseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const status = searchParams.get("status") ?? "all";
  const severity = searchParams.get("severity") ?? "all";
  const risk = searchParams.get("risk") ?? "all";

  function updateParams(next: {
    q?: string;
    status?: string;
    severity?: string;
    risk?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(next)) {
      if (!value || value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function resetFilters() {
    setQuery("");
    router.push(pathname);
  }

  return (
    <div className="border-b border-[#263441] bg-[#0D1218] px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#59616D]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#69727E]">
            Case Filters
          </span>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1.5 text-[9px] text-[#596674] transition hover:text-[#A7AFBA]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[#59616D]" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                updateParams({ q: query.trim() });
              }
            }}
            placeholder="Search cases..."
            className="w-full rounded-lg border border-[#263441] bg-[#0B1016] py-2 pl-8 pr-2.5 text-[9px] text-[#D9DEE7] outline-none placeholder:text-[#59616D] focus:border-[#4F8CFF]/50"
          />
        </label>

        <FilterSelect
          label="Severity"
          value={severity}
          options={[
            { value: "all", label: "All severities" },
            ...severities.map((value) => ({
              value: value.toLowerCase(),
              label: value,
            })),
          ]}
          onChange={(value) => updateParams({ severity: value })}
        />

        <FilterSelect
          label="Status"
          value={status}
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            ...statuses.map((value) => ({
              value: value.toLowerCase(),
              label: value,
            })),
          ]}
          onChange={(value) => updateParams({ status: value })}
        />

        <FilterSelect
          label="Risk"
          value={risk}
          options={[
            { value: "all", label: "All risk" },
            { value: "high", label: "High risk (80+)" },
          ]}
          onChange={(value) => updateParams({ risk: value })}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-[8px] font-medium uppercase tracking-[0.08em] text-[#59616D]">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-[#263441] bg-[#0B1016] px-2.5 py-2 text-[9px] text-[#A7AFBA] outline-none transition focus:border-[#4F8CFF]/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
