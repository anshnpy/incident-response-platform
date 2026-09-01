"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  Clock3,
  Copy,
  ExternalLink,
  FileSearch,
  Hash,
  Link2,
  PackageCheck,
  X,
} from "lucide-react";

export interface EvidencePreview {
  name: string;
  type: string;
  collected: string;
  size: string;
  source: string;
  hash: string;
  custody: string;
  relatedEvent: string;
  relatedEntity: string;
}

interface EvidencePreviewDrawerProps {
  evidence: EvidencePreview | null;
  onClose: () => void;
  onOpen?: () => void;
}

export function EvidencePreviewDrawer({
  evidence,
  onClose,
  onOpen,
}: EvidencePreviewDrawerProps) {
  const [hashCopied, setHashCopied] = React.useState(false);

  const copyHash = async () => {
    if (!evidence?.hash) return;

    try {
      await navigator.clipboard.writeText(evidence.hash);
      setHashCopied(true);

      window.setTimeout(() => {
        setHashCopied(false);
      }, 1600);
    } catch {
      setHashCopied(false);
    }
  };

  return (
    <AnimatePresence>
      {evidence && (
        <motion.div
          className="fixed inset-0 z-[90] bg-black/55 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-[#263441] bg-[#101720] shadow-[-20px_0_50px_rgba(0,0,0,0.35)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#1B2430] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#35D6FF]/18 bg-[#35D6FF]/[0.045]">
                  <FileSearch className="h-4 w-4 text-[#35D6FF]" />
                </div>

                <div className="min-w-0">
                  <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#69727E]">
                    Evidence Preview
                  </div>

                  <h2 className="mt-1 truncate text-[17px] font-semibold tracking-tight text-[#E7ECF2]">
                    {evidence.name}
                  </h2>

                  <div className="mt-1 text-[10px] text-[#69727E]">
                    {evidence.type}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#59616D] transition hover:bg-white/[0.035] hover:text-white"
                aria-label="Close evidence preview"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="border-b border-[#1B2430] px-5 py-4">
                <div className="flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-[#35D6A1]" />
                  <span className="text-[11px] font-semibold text-[#F5F7FA]">
                    Collection Status
                  </span>

                  <span className="ml-auto rounded-md border border-[#35D6A1]/20 bg-[#35D6A1]/[0.05] px-2 py-1 text-[8px] font-medium uppercase text-[#35D6A1]">
                    Verified
                  </span>
                </div>

                <p className="mt-2 text-[10px] leading-5 text-[#69727E]">
                  Artifact was collected and preserved for investigation use.
                </p>
              </div>

              <section className="border-b border-[#1B2430] px-5 py-4">
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#66717D]">
                  Artifact Details
                </div>

                <div className="mt-3.5 grid grid-cols-2 gap-x-5 gap-y-4">
                  <Detail label="Type" value={evidence.type} />
                  <Detail label="Size" value={evidence.size} />
                  <Detail label="Source" value={evidence.source} />
                  <Detail label="Collected" value={evidence.collected} />
                </div>
              </section>

              <section className="border-b border-[#1B2430] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-[#7C6CFF]" />
                  <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                    SHA-256
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[#1B2430] bg-[#090C10] px-3 py-2.5">
                  <code className="min-w-0 flex-1 break-all font-mono text-[10px] leading-5 text-[#B4BDC8]">
                    {evidence.hash}
                  </code>

                  <button
                    type="button"
                    onClick={copyHash}
                    className="shrink-0 rounded-md p-1.5 text-[#59616D] transition hover:bg-white/[0.03] hover:text-white"
                    aria-label={hashCopied ? "SHA-256 copied" : "Copy SHA-256 hash"}
                    title={hashCopied ? "Copied" : "Copy SHA-256"}
                  >
                    {hashCopied ? (
                      <Check className="h-3.5 w-3.5 text-[#43D39E]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </section>

              <section className="border-b border-[#1B2430] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#35D6FF]" />
                  <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                    Investigation Context
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <ContextRow
                    label="Related event"
                    value={evidence.relatedEvent}
                  />

                  <ContextRow
                    label="Related entity"
                    value={evidence.relatedEntity}
                  />
                </div>
              </section>

              <section className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-[#4F8CFF]" />
                  <div className="text-[9px] font-medium uppercase tracking-[0.12em] text-[#59616D]">
                    Chain of Custody
                  </div>
                </div>

                <div className="mt-3.5 border-l border-[#35D6A1]/30 bg-[#35D6A1]/[0.025] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-[#35D6A1] shadow-[0_0_8px_rgba(45,212,168,0.45)]" />

                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-[#D9DEE7]">
                        Evidence preserved
                      </div>

                      <div className="mt-1 text-[9px] text-[#69727E]">
                        {evidence.custody}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div className="flex gap-2 border-t border-[#263441] bg-[#0B1016] p-4">
              <button
                type="button"
                onClick={onOpen ?? onClose}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#4F8CFF] px-4 py-2.5 text-[10px] font-medium text-white transition hover:bg-[#62AEFF]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open Artifact
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#263441] px-4 py-2.5 text-[10px] text-[#A7AFBA] transition hover:border-[#3A4652] hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.1em] text-[#59616D]">
        {label}
      </div>

      <div className="mt-1.5 break-all text-[11px] text-[#C7CDD6]">
        {value}
      </div>
    </div>
  );
}

function ContextRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-[#263441] bg-[#17212B] px-3 py-3">
      <span className="text-[9px] text-[#59616D]">
        {label}
      </span>

      <span className="text-right text-[10px] text-[#C7CDD6]">
        {value}
      </span>
    </div>
  );
}
