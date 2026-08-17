/**
 * Apple App Store Server API client.
 *
 * Security model: we never trust a receipt, a signed payload, or anything the
 * device tells us. We take only the `originalTransactionId` out of untrusted
 * input and then ask Apple, over an authenticated TLS call, what the real
 * subscription state is. That removes the need to verify the JWS x5c chain
 * ourselves while keeping the same guarantee — the answer comes from Apple.
 *
 * Requires secrets: APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY
 * (the contents of the .p8 In-App Purchase key). Keys stay server-side only.
 */
import { APPLE_BUNDLE_ID } from "./entitlements.ts";

const PROD_HOST = "https://api.storekit.itunes.apple.com";
const SANDBOX_HOST = "https://api.storekit-sandbox.itunes.apple.com";

export class AppleConfigError extends Error {}

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

/** Build the short-lived ES256 bearer token the Server API requires. */
async function signAppleJwt(): Promise<string> {
  const keyId = Deno.env.get("APPLE_IAP_KEY_ID");
  const issuerId = Deno.env.get("APPLE_IAP_ISSUER_ID");
  const privateKeyPem = Deno.env.get("APPLE_IAP_PRIVATE_KEY");

  if (!keyId || !issuerId || !privateKeyPem) {
    throw new AppleConfigError(
      "Apple In-App Purchase credentials are not configured yet (APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY).",
    );
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 600,
    aud: "appstoreconnect-v1",
    bid: APPLE_BUNDLE_ID,
  };

  const enc = new TextEncoder();
  const signingInput = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(
    enc.encode(JSON.stringify(payload)),
  )}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(signingInput)),
  );

  return `${signingInput}.${b64url(sig)}`;
}

/** Decode a JWS payload WITHOUT trusting it (used only to read identifiers). */
export function decodeJwsPayload<T = Record<string, unknown>>(jws: string): T | null {
  try {
    const part = jws.split(".")[1];
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded)) as T;
  } catch {
    return null;
  }
}

export interface AppleSubscriptionState {
  environment: "Production" | "Sandbox";
  productId: string;
  originalTransactionId: string;
  /** 1 active, 2 expired, 3 billing retry, 4 grace period, 5 revoked */
  status: number;
  expiresDate: number | null;
  autoRenew: boolean;
  isTrial: boolean;
  bundleId?: string;
}

async function fetchStatuses(host: string, originalTransactionId: string, jwt: string) {
  const res = await fetch(
    `${host}/inApps/v1/subscriptions/${encodeURIComponent(originalTransactionId)}`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  return res;
}

/**
 * Authoritative subscription lookup. Tries production first, then sandbox, so
 * the same code works for TestFlight and sandbox testers.
 */
export async function getAppleSubscriptionState(
  originalTransactionId: string,
): Promise<AppleSubscriptionState | null> {
  const jwt = await signAppleJwt();

  for (const host of [PROD_HOST, SANDBOX_HOST]) {
    const res = await fetchStatuses(host, originalTransactionId, jwt);
    if (res.status === 404) continue;
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`App Store Server API error ${res.status}: ${body.slice(0, 300)}`);
    }

    const body = await res.json();
    const group = (body.data ?? [])[0];
    const item = (group?.lastTransactions ?? [])[0];
    if (!item) continue;

    const txn = decodeJwsPayload<Record<string, any>>(item.signedTransactionInfo) ?? {};
    const renewal = decodeJwsPayload<Record<string, any>>(item.signedRenewalInfo) ?? {};

    return {
      environment: host === PROD_HOST ? "Production" : "Sandbox",
      productId: String(txn.productId ?? item.productId ?? ""),
      originalTransactionId: String(txn.originalTransactionId ?? originalTransactionId),
      status: Number(item.status),
      expiresDate: txn.expiresDate ? Number(txn.expiresDate) : null,
      autoRenew: renewal.autoRenewStatus === 1,
      // offerType 1 == introductory offer (free trial)
      isTrial: txn.offerType === 1 || renewal.offerType === 1,
      bundleId: txn.bundleId ? String(txn.bundleId) : undefined,
    };
  }

  return null;
}

/** Map Apple's numeric subscription status to our ledger status. */
export function appleStatusToLedger(status: number, autoRenew: boolean) {
  switch (status) {
    case 1:
      // Status 1 means Apple considers the subscription active and paid through
      // `expiresDate`. Auto-renew being off is recorded separately on the row
      // (`auto_renew: false`) and must NOT end the entitlement early.
      return autoRenew ? "active" : "canceled";
    case 2:
      return "expired";
    case 3:
      return "grace_period"; // billing retry — keep access per Apple guidance
    case 4:
      return "grace_period";
    case 5:
      return "refunded";
    default:
      return "expired";
  }
}
