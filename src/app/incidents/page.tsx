
import { NavigationRoute } from "@/components/ir/NavigationRoute";
import { IncidentList } from "@/components/ir/IncidentList";
import { getCloudflareContext } from "@opennextjs/cloudflare";

interface WazuhIncident {
  id: string;
  title: string;
  severity: string;
  source: string;
  endpoint: string;
  technique: string | null;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  status: string;
  priority?: string;
}

interface WazuhIncidentsResponse {
  incidents: WazuhIncident[];
}


const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/incidents";

async function getIncidents(): Promise<WazuhIncident[]> {
  try {
    const [wazuhResponse, cloudflareContext] = await Promise.all([
      fetch(SOC_LAB_API, {
        cache: "no-store",
      }),
      getCloudflareContext({ async: true }),
    ]);

    if (!wazuhResponse.ok) {
      return [];
    }

    const data = (await wazuhResponse.json()) as WazuhIncidentsResponse;

    const incidents = Array.isArray(data.incidents)
      ? data.incidents
      : [];

    if (incidents.length === 0) {
      return [];
    }

    const placeholders = incidents.map(() => "?").join(", ");

    const metadataResult = await cloudflareContext.env.DB
      .prepare(
        `SELECT
          incident_id,
          status,
          priority
        FROM incident_metadata
        WHERE incident_id IN (${placeholders})`,
      )
      .bind(...incidents.map((incident) => incident.id))
      .all<{
        incident_id: string;
        status: string;
        priority: string;
      }>();

    const metadataByIncidentId = new Map(
      (metadataResult.results ?? []).map((item) => [
        item.incident_id,
        item,
      ]),
    );

    return incidents.map((incident) => {
      const metadata = metadataByIncidentId.get(incident.id);

      return {
        ...incident,
        status: metadata?.status ?? incident.status,
        priority: metadata?.priority ?? incident.severity.toLowerCase(),
      };
    });
  } catch {
    return [];
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    severity?: string;
    priority?: string;
    status?: string;
    source?: string;
  }>;
}) {
  const incidents = await getIncidents();
  const params = await searchParams;

  const filteredIncidents =
    params?.severity
      ? incidents.filter(
          (incident) =>
            incident.severity.toLowerCase() ===
            params.severity?.toLowerCase(),
        )
      : incidents;

  return (
    <NavigationRoute
      eyebrow="Detection"
      title="Incidents"
      description="Live security incidents derived from Wazuh telemetry and correlated investigation activity."
    >
      <IncidentList
        incidents={filteredIncidents}
        initialSeverity={params?.severity?.toLowerCase() ?? "all"}
        initialPriority={params?.priority?.toLowerCase() ?? "all"}
        initialStatus={params?.status?.toLowerCase() ?? "all"}
        initialSource={params?.source ?? "all"}
      />

      <div className="mt-3 text-[9px] text-[#4F5660]">
        Showing {filteredIncidents.length} live incidents from the connected SOC Lab Wazuh pipeline.
      </div>
    </NavigationRoute>
  );
}
