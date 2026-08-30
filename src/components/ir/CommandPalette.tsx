"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileSearch,
  Globe2,
  Search,
  Shield,
  Siren,
  Terminal,
  X,
} from "lucide-react";

export type SearchItem = {
  id: string;
  label: string;
  meta: string;
  category: "case" | "event" | "entity" | "ioc" | "mitre";
  keywords?: string;
};

interface CommandPaletteProps {
  open: boolean;
  items: SearchItem[];
  onClose: () => void;
  onSelect: (item: SearchItem) => void;
}

const icons = {
  case: Siren,
  event: FileSearch,
  entity: Terminal,
  ioc: Globe2,
  mitre: Shield,
};

export function CommandPalette({
  open,
  items,
  onClose,
  onSelect,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) return items;

    return items
      .map((item) => {
        const label = item.label.toLowerCase();
        const meta = item.meta.toLowerCase();
        const keywords = (item.keywords ?? "").toLowerCase();

        let score = 0;

        if (label === value) {
          score = 100;
        } else if (label.startsWith(value)) {
          score = 80;
        } else if (label.includes(value)) {
          score = 65;
        } else if (meta.includes(value)) {
          score = 50;
        } else if (keywords.includes(value)) {
          score = 30;
        }

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [items, query]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        setActiveIndex((current) => {
          if (results.length === 0) return 0;
          return (current + 1) % results.length;
        });

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setActiveIndex((current) => {
          if (results.length === 0) return 0;
          return (current - 1 + results.length) % results.length;
        });

        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();

        const item = results[activeIndex];

        if (item) {
          onSelect(item);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, onClose, onSelect, open, results]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center bg-black/65 px-4 pt-[12vh] backdrop-blur-sm"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global search"
        className="w-full max-w-[680px] overflow-hidden rounded-2xl border border-[#263441] bg-[#101720] shadow-[0_25px_80px_rgba(0,0,0,0.55),0_0_35px_rgba(77,163,255,0.07)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[#263441] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-[#4F8CFF]" />

          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search cases, events, entities, IOCs..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#F5F7FA] outline-none placeholder:text-[#59616D]"
          />

          <kbd className="rounded-md border border-[#263441] px-2 py-1 text-[9px] text-[#69727E]">
            ESC
          </kbd>

          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-[#59616D] hover:bg-white/[0.03] hover:text-white"
            aria-label="Close search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Search className="mx-auto h-5 w-5 text-[#3A4652]" />

              <div className="mt-3 text-[12px] font-medium text-[#A7AFBA]">
                No results found
              </div>

              <p className="mt-1 text-[10px] text-[#59616D]">
                Try an incident ID, host, user, IP, hash, or technique.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item, index) => {
                const Icon = icons[item.category];
                const active = index === activeIndex;

                return (
                  <button
                    key={`${item.category}-${item.id}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => onSelect(item)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? "border-[#4F8CFF]/20 bg-[#4F8CFF]/[0.06]"
                        : "border-transparent hover:bg-white/[0.025]"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                        active
                          ? "border-[#4F8CFF]/25 bg-[#4F8CFF]/[0.05]"
                          : "border-[#263441] bg-[#17212B]"
                      }`}
                    >
                      <Icon
                        className={`h-3.5 w-3.5 ${
                          active
                            ? "text-[#4F8CFF]"
                            : "text-[#69727E]"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[11px] font-medium text-[#D9DEE7]">
                        {item.label}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-[9px] uppercase tracking-[0.06em] text-[#59616D]">
                          {item.category}
                        </span>

                        <span className="text-[9px] text-[#69727E]">
                          {item.meta}
                        </span>
                      </div>
                    </div>

                    <kbd className="hidden rounded border border-[#263441] px-1.5 py-0.5 text-[8px] text-[#59616D] sm:block">
                      Enter
                    </kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-[#263441] px-4 py-3 text-[9px] text-[#59616D]">
          <span>
            <kbd className="mr-1 rounded border border-[#263441] px-1.5 py-0.5">
              <kbd className="mr-1 rounded border border-[#263441] px-1.5 py-0.5">&uarr; &darr;</kbd>
            </kbd>
            <kbd className="rounded border border-[#263441] px-1.5 py-0.5">
            <kbd className="rounded border border-[#263441] px-1.5 py-0.5">&larr; &rarr;</kbd>{" "}
            </kbd>{" "}
            Navigate
          </span>

          <span>
            <kbd className="mr-1 rounded border border-[#263441] px-1.5 py-0.5">
              Enter
            </kbd>
            Select
          </span>

          <span>
            <kbd className="mr-1 rounded border border-[#263441] px-1.5 py-0.5">
              Esc
            </kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  );
}
