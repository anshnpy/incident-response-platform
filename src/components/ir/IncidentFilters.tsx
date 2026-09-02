"use client";

import { RotateCcw, SlidersHorizontal } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface IncidentFiltersProps {
  severity: string;
  priority: string;
  status: string;
  source: string;
  sort: string;
  severityOptions: FilterOption[];
  priorityOptions: FilterOption[];
  statusOptions: FilterOption[];
  sourceOptions: FilterOption[];
  onSeverityChange: (value: string) => void;
  onPriorityChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onReset: () => void;
}

export function IncidentFilters({
  severity,
  priority,
  status,
  source,
  sort,
  severityOptions,
  priorityOptions,
  statusOptions,
  sourceOptions,
  onSeverityChange,
  onPriorityChange,
  onStatusChange,
  onSourceChange,
  onSortChange,
  onReset,
}: IncidentFiltersProps) {
  return (
    <div className="border-b border-[#263441] bg-[#0D1218] px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#59616D]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#69727E]">
            Filters
          </span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-[9px] text-[#596674] transition hover:text-[#A7AFBA]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <FilterSelect
          label="Severity"
          value={severity}
          options={severityOptions}
          onChange={onSeverityChange}
        />

        <FilterSelect
          label="Priority"
          value={priority}
          options={priorityOptions}
          onChange={onPriorityChange}
        />

        <FilterSelect
          label="Status"
          value={status}
          options={statusOptions}
          onChange={onStatusChange}
        />

        <FilterSelect
          label="Source"
          value={source}
          options={sourceOptions}
          onChange={onSourceChange}
        />

        <FilterSelect
          label="Sort"
          value={sort}
          options={[
            { value: "newest", label: "Newest" },
            { value: "oldest", label: "Oldest" },
            { value: "events-desc", label: "Most Events" },
            { value: "events-asc", label: "Fewest Events" },
            { value: "severity-desc", label: "Highest Severity" },
          ]}
          onChange={onSortChange}
        />

        <div className="flex items-end">
          <div className="w-full rounded-lg border border-[#1B2430] bg-[#10151C] px-3 py-2 text-[9px] text-[#59616D]">
            Filtering live incident data
          </div>
        </div>
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
  options: FilterOption[];
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
        className="w-full rounded-lg border border-[#263441] bg-[#0B1016] px-3 py-2.5 text-[11px] text-[#A7AFBA] outline-none transition focus:border-[#4F8CFF]/50"
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
