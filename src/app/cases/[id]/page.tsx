import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";

import { IncidentHeader } from "@/components/ir/IncidentHeader";
import { InvestigationShell } from "@/components/ir/InvestigationShell";
import { InvestigationWorkspace } from "@/components/ir/InvestigationWorkspace";
import type { InvestigationCase } from "@/types/incident";

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params;
  const { env } = await getCloudflareContext({ async: true });

  const result = await env.DB
    .prepare(
      `SELECT
        id,
        title,
        severity,
        status,
        phase,
        owner,
        affected_user AS affectedUser,
        affected_endpoint AS affectedEndpoint,
        risk_score AS riskScore,
        started_at AS startedAt,
        updated_at AS updatedAt,
        source_incident_id AS sourceIncidentId,
        source_ip AS sourceIp,
        technique,
        occurrences
      FROM cases
      WHERE id = ?
      LIMIT 1`,
    )
    .bind(id)
    .first<InvestigationCase>();

  if (!result) {
    notFound();
  }

  const investigationCase = result;

  return (
    <InvestigationShell>
      <div className="space-y-5">
        <IncidentHeader
          incident={{
            id: investigationCase.id,
            title: investigationCase.title,
            severity: investigationCase.severity,
            status: investigationCase.status,
            phase: investigationCase.phase,
            owner: investigationCase.owner,
            affectedUser: investigationCase.affectedUser,
            affectedEndpoint: investigationCase.affectedEndpoint,
            riskScore: investigationCase.riskScore,
            startedAt: investigationCase.startedAt,
            updatedAt: investigationCase.updatedAt,
          }}
        />

        <InvestigationWorkspace
          caseContext={{
            caseId: investigationCase.id,
            sourceIncidentId: investigationCase.sourceIncidentId,
            status: investigationCase.status,
            sourceIp: investigationCase.sourceIp,
            endpoint: investigationCase.affectedEndpoint,
            technique: investigationCase.technique,
            title: investigationCase.title,
            firstSeen: investigationCase.startedAt,
            lastSeen: investigationCase.updatedAt,
            riskScore: investigationCase.riskScore,
          }}
        />
      </div>
    </InvestigationShell>
  );
}
