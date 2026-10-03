// Media is always addressed through the app so access checks and provider
// changes never require rewriting stored URLs.
export function mediaUrl(assetId: string, opts?: { download?: boolean }): string {
  return `/api/media/${assetId}${opts?.download ? "?download=1" : ""}`;
}
