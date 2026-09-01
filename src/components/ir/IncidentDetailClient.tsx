"use client";

import { useState } from "react";

import { IncidentMetadataControls } from "@/components/ir/IncidentMetadataControls";
import { IncidentActivityPanel } from "@/components/ir/IncidentActivityPanel";

export function IncidentDetailClient({
  incidentId,
  fallbackStatus,
}: {
  incidentId: string;
  fallbackStatus: string;
}) {
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  return (
    <>
      <IncidentMetadataControls
        incidentId={incidentId}
        fallbackStatus={fallbackStatus}
        onSaved={() => setActivityRefreshKey((current) => current + 1)}
      />

      <IncidentActivityPanel
        incidentId={incidentId}
        refreshKey={activityRefreshKey}
      />
    </>
  );
}
