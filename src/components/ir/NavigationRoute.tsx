import type { ReactNode } from "react";

import { InvestigationShell } from "@/components/ir/InvestigationShell";
import { NavigationPage } from "@/components/ir/NavigationPage";

interface NavigationRouteProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function NavigationRoute({
  eyebrow,
  title,
  description,
  children,
}: NavigationRouteProps) {
  return (
    <InvestigationShell>
      <NavigationPage
        eyebrow={eyebrow}
        title={title}
        description={description}
      >
        {children}
      </NavigationPage>
    </InvestigationShell>
  );
}
