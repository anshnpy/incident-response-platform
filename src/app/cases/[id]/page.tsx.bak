import { IncidentHeader } from "@/components/ir/IncidentHeader";
import { InvestigationShell } from "@/components/ir/InvestigationShell";
import { InvestigationWorkspace } from "@/components/ir/InvestigationWorkspace";
import { CreatedCaseView } from "@/components/ir/CreatedCaseView";

const incident = {
  id: "IR-2048",
  title: "Credential Theft Investigation",
  severity: "critical" as const,
  status: "investigating" as const,
  phase: "Lateral Movement",
  owner: "Anshuman Pandey",
  affectedUser: "j.smith",
  affectedEndpoint: "WIN-10-23-17",
  riskScore: 93,
  startedAt: "2026-05-26T09:42:11",
  updatedAt: "2026-05-26T14:30:22",
};

interface CasePageProps {
  params: Promise<{ id: string }>;
}

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params;

  if (id !== "IR-2048") {
    return <CreatedCaseView caseId={id} />;
  }

  return (
    <InvestigationShell>
      <div className="space-y-5">
        <IncidentHeader incident={incident} />
        <InvestigationWorkspace />
      </div>
    </InvestigationShell>
  );
}
