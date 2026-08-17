/**
 * Single source of truth for PixelSqueeze plans across web, iOS and Android.
 *
 * Prices are the same everywhere. Store product IDs must match exactly what is
 * configured in App Store Connect and Google Play Console.
 */
export type Plan = "free" | "creator" | "pro" | "business";
export type BillingPlatform = "web" | "ios" | "android";
export type BillingProvider = "stripe" | "apple" | "google" | "complimentary";

export interface PlanDefinition {
  id: Plan;
  name: string;
  priceMonthly: number;
  tagline: string;
  /** Apple + Google share this product identifier. */
  storeProductId?: string;
  googleBasePlanId?: string;
}

/**
 * Legacy Google Play layout: a single `pro.subscription` product carrying one
 * base plan per tier. Kept as a runtime fallback so builds keep working until
 * the three-product structure is live in Play Console.
 */
export const GOOGLE_LEGACY_PRODUCT_ID = "pro.subscription";

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "Try it out — a few photos a day, no card needed.",
  },
  creator: {
    id: "creator",
    name: "Creator",
    priceMonthly: 9,
    tagline: "For people posting photos every week.",
    storeProductId: "creator.subscription",
    googleBasePlanId: "creator-monthly",
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 19,
    tagline: "For websites, stores and busy photo libraries.",
    storeProductId: "pro.subscription",
    googleBasePlanId: "pro-monthly",
  },
  business: {
    id: "business",
    name: "Business",
    priceMonthly: 39,
    tagline: "Hands-off automation for whole teams.",
    storeProductId: "business.subscription",
    googleBasePlanId: "business-monthly",
  },
};

export const PAID_PLANS: Plan[] = ["creator", "pro", "business"];

const RANK: Record<Plan, number> = { free: 0, creator: 1, pro: 2, business: 3 };

/** True when `have` unlocks everything `need` unlocks. */
export function planSatisfies(have: Plan | null | undefined, need: Plan): boolean {
  return RANK[have ?? "free"] >= RANK[need];
}

export function planRank(plan: Plan | null | undefined): number {
  return RANK[plan ?? "free"];
}

/** Normalize anything the backend or a legacy row might hand us. */
export function normalizePlan(value: unknown): Plan {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (v === "creator" || v === "pro" || v === "business") return v;
  return "free";
}

export function storeProductIdToPlan(productId: string): Plan {
  const match = PAID_PLANS.find((plan) => PLANS[plan].storeProductId === productId);
  return match ?? "free";
}
