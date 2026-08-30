import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const binding = env?.WAZUH_INDEXER;

    if (!binding) {
      return NextResponse.json(
        {
          ok: true,
          hasWazuhBinding: false,
          bindingType: "missing",
        },
        { status: 500 },
      );
    }

    const response = await binding.fetch("https://wazuh-indexer/");

    return NextResponse.json({
      ok: true,
      hasWazuhBinding: true,
      bindingType: typeof binding.fetch,
      requestSucceeded: true,
      upstreamStatus: response.status,
      upstreamOk: response.ok,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
