import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SOC_LAB_API =
  "https://soc-home-lab.anshn-py.workers.dev/api/wazuh/alerts";

export async function GET() {
  try {
    const response = await fetch(SOC_LAB_API, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          hits: {
            hits: [],
          },
          error: "SOC Lab alerts request failed.",
          upstreamStatus: response.status,
        },
        { status: response.status },
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        hits: {
          hits: [],
        },
        error: "Unable to reach SOC Lab alerts API.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
