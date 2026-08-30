import { CreatedCaseInvestigation } from "@/components/ir/CreatedCaseInvestigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return <CreatedCaseInvestigation caseId={id} />;
}
