// GraphQL subscriptions always use a wss:// socket. A caller can point that
// socket at another Cord API (local or e2e) without rebuilding the SDK.
// Returns the origin (scheme, host, port) or undefined when the value is not
// a wss:// URL with a host. Path and trailing slash are dropped.
export function acceptedCordSocketBaseUrl(
  baseApiUrl: string,
): string | undefined {
  let url: URL;
  try {
    url = new URL(baseApiUrl);
  } catch {
    return undefined;
  }

  if (url.protocol !== 'wss:' || url.hostname === '') {
    return undefined;
  }

  return url.origin;
}

export function resolveCordSocketBaseUrl(
  baseApiUrl: string | undefined,
  fallbackHost: string,
): string {
  const fallback = `wss://${fallbackHost}`;
  if (!baseApiUrl) {
    return fallback;
  }
  return acceptedCordSocketBaseUrl(baseApiUrl) ?? fallback;
}
