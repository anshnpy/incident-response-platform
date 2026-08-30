"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Info, TriangleAlert, X } from "lucide-react";

type ToastTone = "success" | "info" | "warning";

interface AppToastProps {
  open: boolean;
  title: string;
  message?: string;
  tone?: ToastTone;
  onClose: () => void;
}

const toneStyles = {
  success: {
    icon: Check,
    iconClass: "text-[#35D6A1]",
    borderClass: "border-[#35D6A1]/20",
  },
  info: {
    icon: Info,
    iconClass: "text-[#35D6FF]",
    borderClass: "border-[#35D6FF]/20",
  },
  warning: {
    icon: TriangleAlert,
    iconClass: "text-[#FFB84D]",
    borderClass: "border-[#FFB84D]/20",
  },
};

export function AppToast({
  open,
  title,
  message,
  tone = "info",
  onClose,
}: AppToastProps) {
  const config = toneStyles[tone];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12, x: 12 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 12, x: 12 }}
          className={`fixed bottom-5 right-5 z-[140] w-[340px] rounded-xl border ${config.borderClass} bg-[#101720] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)]`}
        >
          <div className="flex gap-3">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.iconClass}`} />

            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-medium text-[#F5F7FA]">
                {title}
              </div>

              {message && (
                <div className="mt-1 text-[9px] leading-4 text-[#69727E]">
                  {message}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-1 text-[#59616D] hover:text-white"
              aria-label="Close notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
