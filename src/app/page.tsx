import { CinematicIntro } from "@/components/ir/CinematicIntro";
import { SocCommandCenter } from "@/components/ir/SocCommandCenter";
import { InvestigationShell } from "@/components/ir/InvestigationShell";

export default function Home() {
  return (
    <>
      <CinematicIntro />

      <InvestigationShell>
        <SocCommandCenter />
      </InvestigationShell>
    </>
  );
}
