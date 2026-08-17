/**
 * Google Play Developer API client.
 *
 * Same security model as the Apple client: untrusted input supplies only the
 * purchase token, then we ask Google directly for the real state.
 *
 * Requires secret: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (a service-account key JSON
 * with the "View financial data / manage orders and subscriptions" permission).
 */
import { ANDROID_PACKAGE_NAME } from "./entitlements.ts";

export class GoogleConfigError extends Error {}

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\\n/g, "")
    .replace(/\s+/g, "");
  const raw = atob(body);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;

  const rawJson = Deno.env.get("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON");
  if (!rawJson) {
    throw new GoogleConfigError(
      "Google Play credentials are not configured yet (GOOGLE_PLAY_SERVICE_ACCOUNT_JSON).",
    );
  }

  let creds: { client_email: string; private_key: string };
  try {
    creds = JSON.parse(rawJson);
  } catch {
    throw new GoogleConfigError("GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }

  const now = Math.floor(Date.now() / 1000);
  const enc = new TextEncoder();
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: creds.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const signingInput = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(
    enc.encode(JSON.stringify(claims)),
  )}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(creds.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(signingInput)),
  );
  const assertion = `${signingInput}.${b64url(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token exchange failed ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const body = await res.json();
  cachedToken = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cachedToken.token;
}

export interface GooglePurchaseState {
  productId: string | null;
  basePlanId: string | null;
  purchaseToken: string;
  /** SUBSCRIPTION_STATE_* value from the Play API v2 response. */
  state: string;
  expiryTime: string | null;
  autoRenew: boolean;
  isTrial: boolean;
  acknowledged: boolean;
  linkedUserId: string | null;
  raw: unknown;
}

/** Authoritative purchase lookup via purchases.subscriptionsv2.get. */
export async function getGooglePurchaseState(
  purchaseToken: string,
): Promise<GooglePurchaseState | null> {
  const token = await getAccessToken();
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${ANDROID_PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) {
    throw new Error(`Play API error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }

  const body = await res.json();
  const line = (body.lineItems ?? [])[0] ?? {};

  return {
    productId: line.productId ?? null,
    basePlanId: line.offerDetails?.basePlanId ?? null,
    purchaseToken,
    state: String(body.subscriptionState ?? "SUBSCRIPTION_STATE_UNSPECIFIED"),
    expiryTime: line.expiryTime ?? null,
    autoRenew: Boolean(line.autoRenewingPlan?.autoRenewEnabled),
    isTrial: Boolean(line.offerDetails?.offerId) && Boolean(body.testPurchase) === false
      ? Boolean(line.offerDetails?.offerId)
      : false,
    acknowledged: body.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    linkedUserId: body.externalAccountIdentifiers?.obfuscatedExternalAccountId ?? null,
    raw: body,
  };
}

/** Acknowledge a purchase so Google does not auto-refund it after 3 days. */
export async function acknowledgeGooglePurchase(productId: string, purchaseToken: string) {
  const token = await getAccessToken();
  const url =
    `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/` +
    `${ANDROID_PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/` +
    `${encodeURIComponent(purchaseToken)}:acknowledge`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  // Already-acknowledged returns 400; that is not a failure for us.
  if (!res.ok && res.status !== 400) {
    console.warn(`[playstore] acknowledge failed ${res.status}`);
  }
}

export function googleStateToLedger(state: string, autoRenew: boolean) {
  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      // Paid through `expiryTime` either way; auto-renew is stored separately
      // and `canceled` still grants access until that expiry.
      return autoRenew ? "active" : "canceled";
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return "grace_period";
    case "SUBSCRIPTION_STATE_ON_HOLD":
      return "on_hold";
    case "SUBSCRIPTION_STATE_PAUSED":
      return "paused";
    case "SUBSCRIPTION_STATE_CANCELED":
      return "canceled";
    case "SUBSCRIPTION_STATE_EXPIRED":
      return "expired";
    case "SUBSCRIPTION_STATE_PENDING":
      return "on_hold";
    default:
      return "expired";
  }
}
