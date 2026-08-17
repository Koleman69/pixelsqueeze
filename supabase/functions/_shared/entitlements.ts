/**
 * Shared entitlement logic for PixelSqueeze billing.
 *
 * One place decides "which store product means which PixelSqueeze plan" and
 * one place writes the `subscriptions` ledger. Stripe (web), Apple (iOS) and
 * Google Play (Android) all funnel through here, so the app only ever has to
 * read a single normalized entitlement.
 *
 * Nothing in this file trusts the client: every caller must have already
 * confirmed the purchase with the relevant store's server API.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

export type Plan = "free" | "creator" | "pro" | "business";
export type Platform = "web" | "ios" | "android";
export type Provider = "stripe" | "apple" | "google" | "complimentary";
export type Status =
  | "active"
  | "trialing"
  | "grace_period"
  | "on_hold"
  | "paused"
  | "canceled"
  | "expired"
  | "refunded";

export const APPLE_BUNDLE_ID = "com.pixelsqueeze.app";
export const ANDROID_PACKAGE_NAME = "com.pixelsqueeze.app";

/** Stripe price IDs — the web checkout source of truth. */
export const STRIPE_PRICE_BY_PLAN: Record<Exclude<Plan, "free">, string> = {
  creator: "price_1U5KRrQ9sVcox7vkzF3etl9c",
  pro: "price_1U5KS7Q9sVcox7vkIRbCEba6",
  business: "price_1U5KSLQ9sVcox7vkGmD0lkDd",
};

/**
 * Reverse maps for resolving an existing subscription back to a plan.
 * Legacy entries keep pre-existing paying customers on the plan they had.
 */
const STRIPE_PLAN_BY_ID: Record<string, Plan> = {
  // Current products
  [STRIPE_PRICE_BY_PLAN.creator]: "creator",
  [STRIPE_PRICE_BY_PLAN.pro]: "pro",
  [STRIPE_PRICE_BY_PLAN.business]: "business",
  prod_V5VSiMaYS1xJCe: "creator",
  prod_V5VTGuRaZQN8zT: "pro",
  prod_V5VTRcw45tzuc7: "business",
  // Legacy single-price "Pixel Squeeze Pro" ($6.95) — grandfathered to Pro.
  price_1SBnzFQ9sVcox7vkDJ5xezGy: "pro",
  prod_T847ski0fXnnLJ: "pro",
};

/** Apple + Google share the same product ID scheme. */
const STORE_PLAN_BY_PRODUCT: Record<string, Plan> = {
  "creator.subscription": "creator",
  "pro.subscription": "pro",
  "business.subscription": "business",
};

/**
 * Google Play legacy shape: a single `pro.subscription` product carrying
 * `creator` / `pro` / `business` base plans. If a purchase arrives with a base
 * plan ID, it wins over the product ID so early testers resolve correctly.
 */
const GOOGLE_PLAN_BY_BASE_PLAN: Record<string, Plan> = {
  creator: "creator",
  "creator-monthly": "creator",
  pro: "pro",
  "pro-monthly": "pro",
  business: "business",
  "business-monthly": "business",
};

export function planFromStripe(priceOrProductId?: string | null): Plan {
  if (!priceOrProductId) return "free";
  return STRIPE_PLAN_BY_ID[priceOrProductId] ?? "pro";
}

export function planFromAppleProduct(productId?: string | null): Plan {
  if (!productId) return "free";
  return STORE_PLAN_BY_PRODUCT[productId] ?? "free";
}

export function planFromGoogleProduct(
  productId?: string | null,
  basePlanId?: string | null,
): Plan {
  if (basePlanId && GOOGLE_PLAN_BY_BASE_PLAN[basePlanId]) {
    return GOOGLE_PLAN_BY_BASE_PLAN[basePlanId];
  }
  if (!productId) return "free";
  return STORE_PLAN_BY_PRODUCT[productId] ?? "free";
}

export const PLAN_RANK: Record<Plan, number> = { free: 0, creator: 1, pro: 2, business: 3 };

/**
 * Statuses that grant access on their own, independent of the period end.
 * `grace_period` is included on purpose: the period end has already passed
 * while the store retries billing, and both Apple and Google require us to
 * keep serving the customer during that window.
 */
const ALWAYS_LIVE: Status[] = ["active", "trialing", "grace_period"];

/**
 * Statuses that still grant access *until the already-paid period ends*.
 * Turning auto-renew off does NOT end a subscription — the customer paid for
 * the current period and keeps everything until `current_period_end`.
 */
const LIVE_UNTIL_PERIOD_END: Status[] = ["canceled"];

/** Legacy helper: status-only check. Prefer `isEntitled`. */
export function isLive(status: Status): boolean {
  return ALWAYS_LIVE.includes(status);
}

/**
 * The one place that decides "does this row grant access right now?".
 * Entitlement is a function of (status, current_period_end) — never of
 * auto-renew, which only says whether it will renew again.
 */
export function isEntitled(
  status: Status,
  currentPeriodEnd?: string | null,
  now: number = Date.now(),
): boolean {
  if (ALWAYS_LIVE.includes(status)) {
    // An "active" row whose paid period has demonstrably lapsed is stale.
    if (status === "active" && currentPeriodEnd) {
      return new Date(currentPeriodEnd).getTime() > now;
    }
    if (status === "trialing" && currentPeriodEnd) {
      return new Date(currentPeriodEnd).getTime() > now;
    }
    return true;
  }
  if (LIVE_UNTIL_PERIOD_END.includes(status)) {
    return Boolean(currentPeriodEnd) && new Date(currentPeriodEnd!).getTime() > now;
  }
  // expired / refunded / on_hold / paused never grant access.
  return false;
}

export function titleCasePlan(plan: Plan): string {
  return plan === "free" ? "Free" : plan.charAt(0).toUpperCase() + plan.slice(1);
}

/** Service-role client. Never expose this key or client to the browser. */
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
}

/** Resolve the caller's user from their Supabase JWT. Throws when invalid. */
export async function requireUser(req: Request, admin: SupabaseClient) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header provided");
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await admin.auth.getUser(token);
  if (error) throw new Error(`Authentication error: ${error.message}`);
  const user = data.user;
  if (!user) throw new Error("User not authenticated");
  return user;
}

export interface EntitlementRecord {
  user_id: string;
  plan: Plan;
  platform: Platform;
  provider: Provider;
  product_id?: string | null;
  base_plan_id?: string | null;
  original_transaction_id?: string | null;
  purchase_token?: string | null;
  stripe_subscription_id?: string | null;
  stripe_customer_id?: string | null;
  subscription_status: Status;
  current_period_end?: string | null;
  auto_renew?: boolean;
  is_trial?: boolean;
  environment?: string;
  raw_payload?: unknown;
}

/**
 * Upsert one entitlement row, keyed on the provider's own immutable
 * identifier so replays and webhook retries are idempotent.
 *
 * Returns `{ conflict: true }` when the receipt already belongs to a different
 * PixelSqueeze account — the caller must refuse rather than move the receipt.
 */
export async function upsertEntitlement(
  admin: SupabaseClient,
  record: EntitlementRecord,
): Promise<{ conflict: boolean; ownerUserId?: string }> {
  const keyColumn = record.original_transaction_id
    ? "original_transaction_id"
    : record.purchase_token
      ? "purchase_token"
      : record.stripe_subscription_id
        ? "stripe_subscription_id"
        : null;

  if (keyColumn) {
    const keyValue = (record as Record<string, unknown>)[keyColumn] as string;
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id,user_id")
      .eq(keyColumn, keyValue)
      .maybeSingle();

    if (existing && existing.user_id !== record.user_id) {
      return { conflict: true, ownerUserId: existing.user_id };
    }

    if (existing) {
      await admin
        .from("subscriptions")
        .update({ ...record, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      await syncSubscribersCache(admin, record.user_id);
      return { conflict: false };
    }
  }

  await admin.from("subscriptions").insert(record);
  await syncSubscribersCache(admin, record.user_id);
  return { conflict: false };
}

/**
 * Keep the legacy `subscribers` row in step with the ledger so any existing
 * code that reads `subscribed` / `subscription_tier` keeps working.
 * Never touches email, stripe_customer_id or complimentary_access.
 */
export async function syncSubscribersCache(admin: SupabaseClient, userId: string) {
  const { data: rows } = await admin
    .from("subscriptions")
    .select("plan,subscription_status,current_period_end")
    .eq("user_id", userId);

  const now = Date.now();
  let bestPlan: Plan = "free";
  let bestEnd: string | null = null;

  for (const row of rows ?? []) {
    const status = row.subscription_status as Status;
    if (!isEntitled(status, row.current_period_end, now)) continue;
    const plan = row.plan as Plan;
    if (PLAN_RANK[plan] > PLAN_RANK[bestPlan]) {
      bestPlan = plan;
      bestEnd = row.current_period_end ?? null;
    }
  }

  const { data: subscriber } = await admin
    .from("subscribers")
    .select("id,complimentary_access")
    .eq("user_id", userId)
    .maybeSingle();

  // Complimentary users are managed elsewhere; don't downgrade them here.
  if (subscriber?.complimentary_access === true) return;

  if (!subscriber) return;

  await admin
    .from("subscribers")
    .update({
      subscribed: bestPlan !== "free",
      subscription_tier: bestPlan === "free" ? null : titleCasePlan(bestPlan),
      subscription_end: bestEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", subscriber.id);
}

/** Pick the winning entitlement for a user across every provider. */
export function pickBest<T extends { plan: Plan; subscription_status: Status; current_period_end?: string | null }>(
  rows: T[],
): T | null {
  const now = Date.now();
  let best: T | null = null;
  for (const row of rows) {
    if (!isEntitled(row.subscription_status, row.current_period_end, now)) continue;
    if (!best) {
      best = row;
      continue;
    }
    if (PLAN_RANK[row.plan] > PLAN_RANK[best.plan]) {
      best = row;
      continue;
    }
    // Same tier: prefer the one that runs longest, so a canceled-but-paid row
    // never shadows a renewing one.
    if (PLAN_RANK[row.plan] === PLAN_RANK[best.plan]) {
      const a = row.current_period_end ? new Date(row.current_period_end).getTime() : Infinity;
      const b = best.current_period_end ? new Date(best.current_period_end).getTime() : Infinity;
      if (a > b) best = row;
    }
  }
  return best;
}
