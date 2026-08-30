import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function wazuhFetch(
  url: string,
  options: RequestInit = {},
) {
  const { env } = await getCloudflareContext({ async: true });

  const headers = new Headers(options.headers);
  headers.set("cache-control", "no-store");

  return env.WAZUH_INDEXER.fetch(url, {
    ...options,
    headers,
    cache: "no-store",
  });
}
