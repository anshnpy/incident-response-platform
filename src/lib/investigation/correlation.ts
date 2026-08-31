import type { WazuhAlert } from "./wazuhNormalizer";

export interface CaseCorrelationContext {
  sourceIp?: string;
  endpoint?: string;
  technique?: string | null;
  title?: string;
}

interface ScoredAlert {
  alert: WazuhAlert;
  index: number;
  score: number;
  isDevelopmentNoise: boolean;
}

export function correlateWazuhAlerts(
  alerts: WazuhAlert[],
  caseContext?: CaseCorrelationContext,
  limit = 20,
): WazuhAlert[] {
  const scored: ScoredAlert[] = alerts.map((alert, index) => {
    const source = alert._source;
    const agent = source?.agent;
    const system = source?.data?.win?.system;
    const eventdata = source?.data?.win?.eventdata ?? {};
    const rule = source?.rule;

    const endpoint = caseContext?.endpoint?.toLowerCase();
    const sourceIp = caseContext?.sourceIp?.toLowerCase();
    const technique = caseContext?.technique?.toLowerCase();
    const title = caseContext?.title?.toLowerCase() ?? "";

    const agentName = agent?.name?.toLowerCase() ?? "";
    const agentIp = agent?.ip?.toLowerCase() ?? "";
    const computer = system?.computer?.toLowerCase() ?? "";

    const ruleDescription =
      rule?.description?.toLowerCase() ?? "";

    const image =
      eventdata.image?.toLowerCase() ?? "";

    const commandLine =
      eventdata.commandLine?.toLowerCase() ?? "";

    const eventMessage =
      system?.message?.toLowerCase() ?? "";

    const fullText = [
      ruleDescription,
      image,
      commandLine,
      eventMessage,
    ].join(" ");

    const ruleTechniques = [
      ...(Array.isArray(rule?.mitre?.technique)
        ? rule.mitre.technique
        : rule?.mitre?.technique
          ? [rule.mitre.technique]
          : []),
      ...(Array.isArray(source?.mitre?.technique)
        ? source.mitre.technique
        : source?.mitre?.technique
          ? [source.mitre.technique]
          : []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const devNoisePatterns = [
      "eslint",
      "next build",
      "npm run",
      "npm exec",
      "node.exe",
      "git config",
      "git.exe",
      "conhost.exe",
      "cmd.exe /d /s /c",
      "windows command processor",
      "windows command shell",
    ];

    const isDevelopmentNoise = devNoisePatterns.some(
      (pattern) => fullText.includes(pattern),
    );

    let score = 0;
    let directCaseMatch = false;

    if (endpoint) {
      if (agentName === endpoint) {
        score += 60;
      }

      if (computer === endpoint) {
        score += 45;
      }

      if (
        agentName.includes(endpoint) ||
        endpoint.includes(agentName)
      ) {
        score += 30;
      }
    }

    if (sourceIp && agentIp === sourceIp) {
      score += 40;
    }

    if (technique && ruleTechniques.includes(technique)) {
      score += 70;
      directCaseMatch = true;
    }

    const titleTokens = title
      .split(/[^a-z0-9.:-]+/)
      .filter((token) => token.length >= 4)
      .filter(
        (token) =>
          !["affects", "affect", "python", "64-bit"].includes(token),
      );

    for (const token of titleTokens) {
      if (fullText.includes(token)) {
        score += 15;
        directCaseMatch = true;
      }
    }

    if (
      caseContext?.sourceIp &&
      fullText.includes(caseContext.sourceIp.toLowerCase())
    ) {
      score += 20;
      directCaseMatch = true;
    }

    if (isDevelopmentNoise && !directCaseMatch) {
      score = 0;
    }

    return {
      alert,
      index,
      score,
      isDevelopmentNoise,
    };
  });

  const relevant = scored
    .filter(
      (item) => item.score >= 30 && !item.isDevelopmentNoise,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const selected =
    relevant.length > 0
      ? relevant
      : scored
          .filter((item) => !item.isDevelopmentNoise)
          .sort((a, b) => b.score - a.score)
          .slice(0, limit);

  return selected.map((item) => item.alert);
}
