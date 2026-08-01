const TOKEN_KEY = "pixelsqueeze_free_client_token";

/**
 * Returns a persistent, random, per-device token used to key anonymous
 * free-trial usage. Unlike an email address, this value is secret to the
 * device, so nobody can look up or burn another person's free credits.
 */
export function getFreeToolClientToken(): string {
  try {
    const existing = localStorage.getItem(TOKEN_KEY);
    if (existing && /^[A-Za-z0-9_-]{24,}$/.test(existing)) return existing;
  } catch {
    // localStorage unavailable — fall through and generate an ephemeral token
  }

  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // ignore
  }
  return token;
}
