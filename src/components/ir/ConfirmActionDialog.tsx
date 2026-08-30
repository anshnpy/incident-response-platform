"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  Check,
  Loader2,
  X,
} from "lucide-react";

interface ConfirmActionDialogProps {
  open: boolean;
  actionName: string;
  target: string;
  description: string;
  state: "confirm" | "running" | "success";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmActionDialog({
  open,
  actionName,
  target,
  description,
  state,
  onConfirm,
  onClose,
}: ConfirmActionDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-[440px] overflow-hidden rounded-2xl border border-[#263441] bg-[#101720] shadow-[0_0_40px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between border-b border-[#263441] px-5 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#FF5364]/20 bg-[#FF5364]/[0.06]">
                  {state === "success" ? (
                    <Check className="h-4 w-4 text-[#35D6A1]" />
                  ) : state === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#4F8CFF]" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-[#FF5364]" />
                  )}
                </div>

                <div>
                  <h2 className="text-[15px] font-semibold text-[#F5F7FA]">
                    {state === "success"
                      ? "Action completed"
                      : state === "running"
                        ? "Executing response"
                        : "Confirm response action"}
                  </h2>

                  <p className="mt-1 text-[10px] text-[#69727E]">
                    {actionName}
                  </p>
                </div>
              </div>

              {state === "confirm" && (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md p-1.5 text-[#59616D] hover:text-white"
                  aria-label="Close confirmation"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="p-5">
              <div className="rounded-xl border border-[#263441] bg-[#090C10] p-4">
                <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-[#59616D]">
                  Target
                </div>

                <div className="mt-2 font-mono text-[12px] text-[#D9DEE7]">
                  {target}
                </div>

                <p className="mt-3 text-[11px] leading-5 text-[#A7AFBA]">
                  {description}
                </p>
              </div>

              {state === "confirm" && (
                <div className="mt-4 rounded-lg border border-[#FFB84D]/15 bg-[#FFB84D]/[0.035] px-3 py-2.5 text-[9px] leading-4 text-[#A7AFBA]">
                  This action may affect the affected system or identity.
                  Continue only after validating the target.
                </div>
              )}

              {state === "running" && (
                <div className="mt-4">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-[#69727E]">
                      Processing response action
                    </span>
                    <span className="text-[#4F8CFF]">
                      In progress
                    </span>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#263441]">
                    <motion.div
                      initial={{ width: "10%" }}
                      animate={{ width: "72%" }}
                      transition={{ duration: 0.9 }}
                      className="h-full rounded-full bg-[#4F8CFF]"
                    />
                  </div>
                </div>
              )}

              {state === "success" && (
                <div className="mt-4 rounded-lg border border-[#35D6A1]/15 bg-[#35D6A1]/[0.035] px-3 py-2.5 text-[9px] text-[#35D6A1]">
                  Response activity has been recorded in the investigation
                  audit trail.
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2">
                {state === "confirm" && (
                  <>
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-lg border border-[#263441] px-4 py-2.5 text-[10px] text-[#A7AFBA] hover:border-[#3A4652] hover:text-white"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={onConfirm}
                      className="rounded-lg border border-[#FF5364]/25 bg-[#FF5364]/[0.08] px-4 py-2.5 text-[10px] font-medium text-[#FF6B76] shadow-[0_0_14px_rgba(255,77,90,0.08)] hover:bg-[#FF5364]/[0.12]"
                    >
                      Confirm action
                    </button>
                  </>
                )}

                {state === "success" && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg bg-[#4F8CFF] px-4 py-2.5 text-[10px] font-medium text-white hover:bg-[#62AEFF]"
                  >
                    Done
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
