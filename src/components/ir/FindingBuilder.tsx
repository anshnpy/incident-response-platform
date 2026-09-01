"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FindingClassification } from "@/components/ir/FindingClassification";
import {
  FileCheck2,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

interface FindingBuilderProps {
  open: boolean;
  onClose: () => void;
  evidence: Array<{
    name: string;
    type: string;
    collected: string;
    size: string;
  }>;
  entities: Array<{
    name: string;
    type: string;
    risk: number;
  }>;
  onSave: (finding: {
    title: string;
    description: string;
    severity: string;
    confidence: string;
    technique: string;
    evidence: string[];
    entities: string[];
  }) => void | Promise<void>;
}

export function FindingBuilder({
  open,
  onClose,
  evidence,
  entities,
  onSave,
}: FindingBuilderProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("high");
  const [confidence, setConfidence] = useState("high");
  const [technique, setTechnique] = useState("T1003.001");
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle || !trimmedDescription) {
      setValidationError(
        !trimmedTitle
          ? "Finding title is required."
          : "Finding description is required.",
      );
      return;
    }

    setValidationError(null);
    setSaving(true);

    try {
      await onSave({
        title: trimmedTitle,
        description: trimmedDescription,
        severity,
        confidence,
        technique,
        evidence: selectedEvidence,
        entities: selectedEntities,
      });

      onClose();
    } catch (error) {
      setValidationError(
        error instanceof Error
          ? error.message
          : "Unable to save finding.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm"
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
            onClick={(event) => event.stopPropagation()}
            className="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col border-l border-[#263441] bg-[#0B1016]"
          >
            <div className="flex items-start justify-between border-b border-[#263441] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#7C6CFF]/20 bg-[#7C6CFF]/[0.05]">
                  <FileCheck2 className="h-4 w-4 text-[#7C6CFF]" />
                </div>

                <div>
                  <div className="text-[9px] uppercase tracking-[0.12em] text-[#59616D]">
                    Investigation
                  </div>

                  <h2 className="mt-1 text-[16px] font-semibold text-[#F5F7FA]">
                    Create Finding
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#59616D] hover:bg-white/[0.03] hover:text-white"
                aria-label="Close finding builder"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-5">
                <Field label="Finding title">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="e.g. Credential dumping confirmed"
                    className="w-full rounded-lg border border-[#263441] bg-[#101720] px-3 py-2.5 text-[11px] text-[#F5F7FA] outline-none placeholder:text-[#59616D] focus:border-[#4F8CFF]/50"
                  />
                </Field>

                <Field label="Description">
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="Describe the evidence-backed conclusion..."
                    rows={6}
                    className="w-full resize-none rounded-lg border border-[#263441] bg-[#101720] px-3 py-2.5 text-[11px] leading-5 text-[#F5F7FA] outline-none placeholder:text-[#59616D] focus:border-[#4F8CFF]/50"
                  />
                </Field>

                <FindingClassification
                  severity={severity as "low" | "medium" | "high" | "critical"}
                  confidence={confidence as "low" | "medium" | "high"}
                  onSeverityChange={setSeverity}
                  onConfidenceChange={setConfidence}
                />

                <Field label="MITRE ATT&CK technique">
                  <input
                    value={technique}
                    onChange={(event) => setTechnique(event.target.value)}
                    className="w-full rounded-lg border border-[#263441] bg-[#101720] px-3 py-2.5 font-mono text-[11px] text-[#35D6FF] outline-none focus:border-[#35D6FF]/50"
                  />
                </Field>

                <Field label="Attach evidence">
                  <div className="space-y-2">
                    {evidence.map((item) => {
                      const selected = selectedEvidence.includes(item.name);

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setSelectedEvidence((current) =>
                              selected
                                ? current.filter((name) => name !== item.name)
                                : [...current, item.name],
                            );
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                            selected
                              ? "border-[#35D6FF]/25 bg-[#35D6FF]/[0.05]"
                              : "border-[#263441] bg-[#101720] hover:border-[#3A4652]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-[#35D6FF] bg-[#35D6FF] text-[#061018]"
                                : "border-[#3A4652] bg-[#0B1016]"
                            }`}
                          >
                            {selected && (
                              <span className="text-[9px] font-bold">&check;</span>
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-medium text-[#D9DEE7]">
                              {item.name}
                            </div>

                            <div className="mt-1 text-[9px] text-[#69727E]">
                              {item.type} &middot; {item.size} &middot; {item.collected}
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {evidence.length === 0 && (
                      <div className="rounded-lg border border-[#263441] bg-[#101720] px-3 py-4 text-[10px] text-[#69727E]">
                        No evidence available for this investigation.
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Attach entities">
                  <div className="space-y-2">
                    {entities.map((item) => {
                      const selected = selectedEntities.includes(item.name);

                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => {
                            setSelectedEntities((current) =>
                              selected
                                ? current.filter((name) => name !== item.name)
                                : [...current, item.name],
                            );
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                            selected
                              ? "border-[#7C6CFF]/30 bg-[#7C6CFF]/[0.05]"
                              : "border-[#263441] bg-[#101720] hover:border-[#3A4652]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                              selected
                                ? "border-[#7C6CFF] bg-[#7C6CFF] text-white"
                                : "border-[#3A4652] bg-[#0B1016]"
                            }`}
                          >
                            {selected && (
                              <span className="text-[9px] font-bold">&check;</span>
                            )}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[10px] font-medium text-[#D9DEE7]">
                              {item.name}
                            </div>

                            <div className="mt-1 text-[9px] text-[#69727E]">
                              {item.type} &middot; Risk {item.risk}/100
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {entities.length === 0 && (
                      <div className="rounded-lg border border-[#263441] bg-[#101720] px-3 py-4 text-[10px] text-[#69727E]">
                        No entities available for this investigation.
                      </div>
                    )}
                  </div>
                </Field>

                <div className="rounded-xl border border-[#263441] bg-[#101720] p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#35D6FF]" />
                    <div>
                      <div className="text-[10px] font-medium text-[#D9DEE7]">
                        Investigation context
                      </div>
                      <div className="mt-1 text-[9px] text-[#69727E]">
                        Current event and available evidence will be attached
                        when the finding is saved.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#263441] bg-[#0D131A] p-4">
              {validationError && (
                <div className="mb-3 rounded-lg border border-[#FF5364]/20 bg-[#FF5364]/[0.04] px-3 py-2 text-[9px] leading-4 text-[#FF8A96]">
                  {validationError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#263441] px-4 py-2.5 text-[10px] text-[#A7AFBA] hover:border-[#3A4652] hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-[#4F8CFF] px-4 py-2.5 text-[10px] font-medium text-white transition hover:bg-[#62AEFF] disabled:cursor-wait disabled:opacity-50"
                >
                  <Save className="h-3.5 w-3.5" />
                  {saving ? "Saving..." : "Save Draft"}
                </button>
              </div>
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
        {label}
      </span>
      {children}
    </label>
  );
}

