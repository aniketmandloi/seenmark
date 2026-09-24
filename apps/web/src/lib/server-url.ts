type Environment = Record<string, string | undefined>;

type Surroundings = {
  env?: Environment;
  browserOrigin?: string | null;
};

function withoutTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * The absolute server URL for a configured NEXT_PUBLIC_SERVER_URL, which may be relative
 * (`/api` on Vercel). The browser resolves it against the page; the Next server prefers an
 * explicit SERVER_URL, then the Vercel deployment origin, then the local server.
 */
export function resolveServerUrl(
  configured: string | undefined,
  {
    env = (globalThis as { process?: { env?: Environment } }).process?.env,
    browserOrigin = typeof window === "undefined" ? null : window.location.origin,
  }: Surroundings = {},
) {
  if (!browserOrigin && env?.SERVER_URL) {
    return withoutTrailingSlash(env.SERVER_URL);
  }

  if (!configured) {
    throw new Error("NEXT_PUBLIC_SERVER_URL is not set");
  }
  const normalized = withoutTrailingSlash(configured);
  if (!normalized.startsWith("/")) {
    return normalized;
  }

  if (browserOrigin) {
    return `${browserOrigin}${normalized}`;
  }

  const vercelUrl =
    env?.VERCEL_ENV === "production"
      ? (env?.VERCEL_PROJECT_PRODUCTION_URL ?? env?.VERCEL_URL)
      : (env?.VERCEL_URL ?? env?.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelUrl) {
    const origin = vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`;
    return `${origin}${normalized}`;
  }

  return `http://localhost:3000${normalized}`;
}
