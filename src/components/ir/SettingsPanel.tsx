"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

interface SettingsState {
  compactMode: boolean;
  autoRefresh: boolean;
  notifications: boolean;
}

const STORAGE_KEY = "incident-response-settings";

const defaults: SettingsState = {
  compactMode: false,
  autoRefresh: true,
  notifications: true,
};

export function SettingsPanel() {
  const [settings, setSettings] = useState<SettingsState>(() => {
    if (typeof window === "undefined") {
      return defaults;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return defaults;
      }

      const parsed = JSON.parse(raw) as Partial<SettingsState>;

      return {
        compactMode:
          typeof parsed.compactMode === "boolean"
            ? parsed.compactMode
            : defaults.compactMode,
        autoRefresh:
          typeof parsed.autoRefresh === "boolean"
            ? parsed.autoRefresh
            : defaults.autoRefresh,
        notifications:
          typeof parsed.notifications === "boolean"
            ? parsed.notifications
            : defaults.notifications,
      };
    } catch {
      return defaults;
    }
  });

  const [saved, setSaved] = useState(false);

  function updateSetting(key: keyof SettingsState, value: boolean) {
    const next = {
      ...settings,
      [key]: value,
    };

    setSettings(next);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    } catch {
      setSaved(false);
    }
  }

  function resetSettings() {
    setSettings(defaults);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1200);
    } catch {
      setSaved(false);
    }
  }

  return (
    <div>
      <div className="divide-y divide-[#263441]/70">
        <SettingRow
          title="Compact Investigation Mode"
          description="Reduce vertical spacing across investigation surfaces."
          checked={settings.compactMode}
          onChange={(value) => updateSetting("compactMode", value)}
        />

        <SettingRow
          title="Telemetry Auto Refresh"
          description="Allow live dashboard surfaces to refresh their telemetry."
          checked={settings.autoRefresh}
          onChange={(value) => updateSetting("autoRefresh", value)}
        />

        <SettingRow
          title="Analyst Notifications"
          description="Show in-app notification indicators for workspace activity."
          checked={settings.notifications}
          onChange={(value) => updateSetting("notifications", value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#263441] px-4 py-3">
        <span className="text-[9px] text-[#59616D]">
          {saved ? "Preferences saved" : "Changes save automatically"}
        </span>

        <button
          type="button"
          onClick={resetSettings}
          className="inline-flex items-center gap-1.5 text-[9px] text-[#596674] transition hover:text-[#A7AFBA]"
        >
          <RotateCcw className="h-3 w-3" />
          Reset preferences
        </button>
      </div>
    </div>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <div className="min-w-0">
        <div className="text-[10px] font-medium text-[#D9DEE7]">
          {title}
        </div>

        <div className="mt-1 text-[9px] leading-4 text-[#69727E]">
          {description}
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition ${
          checked
            ? "border-[#35D6A1]/30 bg-[#35D6A1]/15"
            : "border-[#263441] bg-[#0B1016]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full transition ${
            checked
              ? "left-[17px] bg-[#35D6A1]"
              : "left-0.5 bg-[#59616D]"
          }`}
        />
      </button>
    </div>
  );
}
