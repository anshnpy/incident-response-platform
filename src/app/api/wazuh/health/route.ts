import { NextResponse } from "next/server";
import { wazuhFetch } from "@/lib/wazuhFetch";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const response = await wazuhFetch("https://wazuh-indexer/", {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          connected: false,
          service: "Wazuh Indexer",
          status: response.status,
          error: "Wazuh Indexer request failed.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      connected: true,
      service: "Wazuh Indexer",
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        connected: false,
        service: "Wazuh Indexer",
        error: "Unable to reach Wazuh Indexer.",
        details:
          error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
