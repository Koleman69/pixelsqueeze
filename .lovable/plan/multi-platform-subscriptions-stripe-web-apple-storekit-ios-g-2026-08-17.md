# Multi-Platform Subscriptions: Stripe (Web) + Apple StoreKit (iOS) + Google Play Billing (Android)

## 1. What already exists

**Web billing (works, but incomplete)**
- `src/lib/checkout.ts` — `startCheckout()` calls `create-checkout`, passes `x-app-origin` so Capacitor's `capacitor://localhost` origin doesn't break Stripe redirects, and opens the URL in Capacitor Browser on native.
- `supabase/functions/create-checkout` — creates a Stripe Checkout session, `mode: subscription`, `trial_period_days: 3`.
- `supabase/functions/customer-portal` — Stripe billing portal (called from `Account.tsx` and `useImageCompression`).
- `supabase/functions/check-subscription` — honors `subscribers.complimentary_access` first, then queries Stripe by email; returns `subscribed`, `is_trialing`, `trial_end`, `product_id`, `subscription_end`.
- `subscribers` table already has `user_id`, `email`, `stripe_customer_id`, `subscribed`, `subscription_tier`, `subscription_end`, `complimentary_access`, `free_compressions_used`.

**Native shell**
- Capacitor 8 iOS + Android projects exist, bundle ID `com.pixelsqueeze.app`, assets bundled from `dist/` (not a remote webview).
- `src/lib/native.ts` centralizes all native calls behind `Capacitor.isNativePlatform()`.
- No billing plugin installed.

**Pricing UI**
- `src/pages/Pricing.tsx` — 5 tiers: Free, Creator $9, Pro $19, Business $39, API $99 (contact sales). Creator/Pro/Business CTAs read "Start 3-Day Free Trial".

## 2. What is currently wrong or incomplete

1. **All paid buttons buy the same thing.** `startCheckout()` takes no arguments and `create-checkout` hardcodes one price ID (`price_1SBnzFQ9sVcox7vkDJ5xezGy`). Clicking Creator, Pro, or Business produces the identical Stripe subscription. This must be fixed regardless of native billing.
2. **No tier resolution.** `check-subscription` returns a raw Stripe `product_id`; nothing maps product → Creator/Pro/Business, so the app can't gate features per tier.
3. **Entitlement is computed live from Stripe on every call.** There is no stored entitlement row, so Apple/Google can't participate and every check costs a Stripe API round-trip.
4. **Native devices would open Stripe Checkout** — an automatic App Store rejection (Guideline 3.1.1) and a Play Payments policy violation for digital goods.
5. **Trial mismatch.** Stripe grants 3 days. Apple/Google introductory offers are configured in the stores, not in code. Until you configure them, native UI must not promise a trial.
6. **`subscribers` has no provider/platform columns**, no Apple `original_transaction_id`, no Google `purchase_token`, no `auto_renew`.
7. **Stripe lookup is by email**, which silently breaks if a user changes their account email.

## 3. Recommended Supabase entitlement structure

Keep `subscribers` as-is (production data, `complimentary_access`, `free_compressions_used`) and add **one new table** that is the raw ledger of purchases per provider:

`public.subscriptions`
- `user_id`, `plan` (`free|creator|pro|business`), `platform` (`web|ios|android`), `provider` (`stripe|apple|google|complimentary`)
- `product_id`, `original_transaction_id` (Apple), `purchase_token` (Google), `stripe_subscription_id`
- `subscription_status` (`active|trialing|grace_period|on_hold|paused|canceled|expired|refunded`)
- `current_period_end`, `auto_renew`, `is_trial`, `raw_payload jsonb`, `created_at`, `updated_at`
- Unique indexes on `original_transaction_id` and `purchase_token` so a receipt can never be redeemed onto two accounts.
- RLS: users read only their own rows; **no client INSERT/UPDATE/DELETE at all** — writes happen exclusively from Edge Functions using the service role.
- Grants: `SELECT` to `authenticated`, `ALL` to `service_role`. No `anon` access.

Resolution order for the effective plan (highest wins): `complimentary_access` → any `active`/`trialing`/`grace_period` row, ranked business > pro > creator. `subscribers.subscription_tier` stays in sync as a denormalized cache so nothing currently reading it breaks.

## 4. Recommended Android product structure

**Use three separate subscription products** — `creator.subscription`, `pro.subscription`, `business.subscription`, each with one monthly base plan — and retire the current single `pro.subscription` with `creator`/`pro`/`business` base plans.

Why for this app specifically:
- **Parity with Apple.** Apple already has three product IDs. One shared verification/mapping table (`product_id → plan`) works for both stores, instead of Android needing a second base-plan-level mapping layer.
- **Base plans are meant for billing-period and region variants of the same tier** (monthly vs annual, prepaid vs auto-renew), not for different feature tiers. Using them as tiers makes the Play Console reporting, pricing, and offer management read as one product with three prices.
- **Upgrade/downgrade proration** between separate products is explicit via `replaceProrationMode`; across base plans of one product it's more constrained.
- When you add annual plans later, three products × 2 base plans is clean; one product × 6 base plans is not.

Note: Google does not allow reusing a product ID after deletion, so `pro.subscription` stays but gets a single `pro-monthly` base plan; the `creator` and `business` base plans get deactivated after migration. Since these aren't live yet, there are no existing purchasers to migrate.

## 5. Files that will change

| File | Change |
| --- | --- |
| `src/lib/checkout.ts` | Accept a `plan` argument; route to Stripe on web only. |
| `src/pages/Pricing.tsx` | Route CTAs through the new billing facade; hide trial copy and the API tier on native; show store-appropriate price strings. |
| `src/pages/Account.tsx` | Provider-aware "Manage Subscription" + "Restore Purchases" (native only). |
| `src/hooks/useImageCompression.tsx` | Consume the normalized entitlement shape, add `plan`/`provider`. |
| `supabase/functions/create-checkout/index.ts` | Accept a validated `plan`, map to the right Stripe price, write to `subscriptions`. |
| `supabase/functions/check-subscription/index.ts` | Read entitlement from `subscriptions` (all providers), reconcile Stripe, return the normalized payload. |
| `supabase/functions/customer-portal/index.ts` | Return a clear error for Apple/Google-billed users instead of failing on a missing Stripe customer. |
| `supabase/config.toml` | Register the new functions; webhooks `verify_jwt = false`. |
| `capacitor.config.ts` | Billing plugin config if required. |
| `ios/App/App/*`, `android/app/build.gradle` | In-app purchase capability / Play Billing dependency via `cap sync`. |
| `package.json` | New plugin dependency. |

## 6. New files, functions, and packages

**Packages:** `@revenuecat/purchases-capacitor` (recommended) or `@capgo/capacitor-purchases`. RevenueCat is the recommendation: it wraps StoreKit 2 and Play Billing 7 behind one API, handles restore, and Apple/Google server notifications go to RevenueCat, which relays a single normalized webhook to Supabase — that removes the need for us to implement Apple JWS signature-chain verification and Google service-account OAuth by hand. A pure-StoreKit alternative is described in §11 if you'd rather not add a third-party dependency.

**New shared client code**
- `src/lib/billing/platform.ts` — `getBillingPlatform(): 'web' | 'ios' | 'android'`.
- `src/lib/billing/plans.ts` — single source of truth mapping plan → Stripe price ID, Apple product ID, Google product ID + base plan.
- `src/lib/billing/index.ts` — `purchasePlan(plan)`, `restorePurchases()`, `manageSubscription()`; dispatches by platform.
- `src/lib/billing/native.ts` — StoreKit / Play Billing calls, lazily imported so the web bundle is unaffected.

**New Edge Functions**
- `verify-apple-purchase` — validates the signed transaction / App Store Server API lookup, upserts entitlement.
- `verify-google-purchase` — `purchases.subscriptionsv2.get` against the Play Developer API, upserts entitlement.
- `apple-subscription-webhook` — App Store Server Notifications V2 (`DID_RENEW`, `EXPIRED`, `DID_FAIL_TO_RENEW`, `REFUND`, `DID_CHANGE_RENEWAL_STATUS`, `GRACE_PERIOD_EXPIRED`).
- `google-subscription-webhook` — Play RTDN via Pub/Sub push (`SUBSCRIPTION_RENEWED`, `CANCELED`, `EXPIRED`, `ON_HOLD`, `IN_GRACE_PERIOD`, `REVOKED`).
- `supabase/functions/_shared/entitlements.ts` — shared plan mapping + upsert logic.
- (If RevenueCat) a single `revenuecat-webhook` replaces the four above; the verify functions become thin confirmations.

**Secrets** (server-side only, never in the client): Apple issuer ID / key ID / `.p8` private key, Apple shared secret, Google service-account JSON, RTDN verification token — or the RevenueCat secret API key + webhook auth header.

## 7. Exact Apple purchase flow

1. User taps Creator/Pro/Business in the iOS app. `getBillingPlatform()` returns `ios`.
2. Client fetches products for `creator.subscription` / `pro.subscription` / `business.subscription` and presents the **store-provided localized price** (Apple requires displaying the store price, not a hardcoded $9).
3. StoreKit 2 purchase sheet → Apple handles payment and Face ID.
4. On success the client receives the signed transaction (JWS) plus `originalTransactionId`. **No entitlement is granted client-side.**
5. Client calls `verify-apple-purchase` with the user's Supabase JWT and the transaction identifier.
6. The function verifies the JWS signature chain against Apple's root CA (or queries the App Store Server API by transaction ID with a signed ES256 JWT), confirms bundle ID `com.pixelsqueeze.app`, environment, expiry, and that the `original_transaction_id` isn't already bound to another user.
7. Function upserts `subscriptions` (provider `apple`, platform `ios`) and syncs `subscribers.subscription_tier`.
8. Client refetches `check-subscription`; features unlock.
9. Renewals/cancellations/refunds arrive at `apple-subscription-webhook` and update the same row — no app launch required.

## 8. Exact Google purchase flow

1. Android user taps a plan; platform resolves to `android`.
2. Query Play Billing for the product + `pro-monthly`-style base plan, show the store price, launch the billing flow with the `offerToken`.
3. On success the client gets a `purchaseToken`.
4. Client calls `verify-google-purchase` with its Supabase JWT + `purchaseToken` + `productId`.
5. Function authenticates as the service account, calls `purchases.subscriptionsv2.get`, checks `subscriptionState`, expiry, package name, and token uniqueness.
6. Function **acknowledges the purchase** (Play auto-refunds within 3 days if unacknowledged), upserts `subscriptions`, syncs `subscribers`.
7. Client refetches entitlement.
8. RTDN → `google-subscription-webhook` keeps the row current for renewals, holds, grace periods, and revocations.

## 9. How Stripe coexists / how existing subscribers are protected

- Stripe code paths are **only touched to add the missing plan parameter**. Web keeps using Stripe Checkout and the Stripe billing portal exactly as today.
- `check-subscription` keeps its current Stripe reconciliation as one input among several; `complimentary_access` keeps winning first, unchanged.
- A **backfill step (read-only, additive)** writes one `subscriptions` row per currently-active Stripe subscriber so nobody loses access at cutover. No existing row is deleted or overwritten; `subscribers` keeps every current column.
- If a user somehow has both Stripe and Apple, the ranked resolution grants the higher tier and Account shows the provider that must be used to cancel — we never cancel a Stripe subscription automatically.
- Rollout is behind a flag so native billing can be disabled instantly, falling back to "manage your subscription on the web".

## 10. Restore Purchases design

- Visible **only on native** (`Account.tsx`), as Apple requires a restore path for non-consumable/auto-renewing purchases.
- Calls the store's restore/`syncPurchases`, collects the recovered transaction IDs, and posts them to the matching verify function under the current Supabase JWT.
- If a receipt is already bound to a different account, the server refuses and the UI says to sign in with the original account — receipts are never silently transferred.
- Also runs automatically once on native app launch after sign-in so a reinstalled app self-heals.

## 11. Cancellation and renewal handling

- Cancellation is always performed in the store: Apple → `itms-apps://apps.apple.com/account/subscriptions`, Google → the Play subscriptions deep link, Stripe → the billing portal. Account shows exactly one of these based on `provider`.
- Entitlement stays active until `current_period_end` when `auto_renew` is false; grace period and on-hold keep access per store semantics; refunds/revocations drop access immediately.

## 12. Manual App Store Connect configuration you must complete

1. Move `creator.subscription`, `pro.subscription`, `business.subscription` out of "Prepare for Submission": set prices ($9 / $19 / $39 tiers), add localized display name + description, and a review screenshot for each — missing metadata is the most common IAP rejection.
2. **Trial:** the 3-day trial does **not** exist on Apple until you add an *Introductory Offer* of type "Free Trial", duration 3 days, to each product in group 22291979. Until then the iOS UI will not show trial copy. Apple's minimum free-trial duration is 3 days, so 3 days is valid.
3. Ranking within the subscription group (Business highest) so upgrade/downgrade proration behaves.
4. Create an **App Store Server Notifications V2** production + sandbox URL pointing at `apple-subscription-webhook`.
5. Generate an **In-App Purchase key** (`.p8`) in Users and Access → Integrations; give me the key ID and issuer ID, and store the `.p8` as a secret.
6. Create a **Sandbox tester** account in Users and Access → Sandbox.
7. Add the In-App Purchase capability to the App target in Xcode.
8. App Privacy: declare purchase history if not already declared.

## 13. Manual Google Play Console configuration you must complete

1. Create `creator.subscription` and `business.subscription` as new subscriptions with a single monthly auto-renewing base plan each; reduce `pro.subscription` to one monthly base plan and deactivate its `creator`/`business` base plans.
2. Set prices $9 / $19 / $39 and activate every base plan (an inactive base plan silently returns no offers).
3. **Trial:** add a *Free trial* offer (3 days) to each base plan, with eligibility criteria — otherwise the Android UI shows no trial.
4. Enable **Real-time developer notifications**: create a Pub/Sub topic, grant the Play publisher service account permission, and add a push subscription pointing to `google-subscription-webhook`.
5. Create a **Google Cloud service account** with the Play Developer API enabled, grant it "View financial data" + "Manage orders and subscriptions" in Play Console, and give me the JSON key to store as a secret.
6. Upload a build to an internal testing track and add **license testers** (test purchases only work for testers on a track).
7. Complete the Play Data safety form for purchase data.

## 14. Testing plan

- **iOS:** StoreKit configuration file in the simulator for the fast loop; then Sandbox tester on a physical device for purchase → verify → entitlement, restore after delete/reinstall, upgrade Creator→Pro, cancel, and refund. Then TestFlight (TestFlight purchases run in sandbox and are free). Sandbox renews an accelerated month in ~5 minutes, so renewal webhooks are testable in one sitting.
- **Android:** internal testing track with license testers (test cards, no real charge), covering purchase, acknowledge, restore, upgrade with proration, cancel, and the "test instant" renewal cadence.
- **Server:** unit tests for plan resolution ranking and receipt-collision refusal; replay recorded Apple V2 and Google RTDN payloads against the webhooks.
- **Cross-platform:** buy on iOS, sign into the same account on web and Android, confirm the tier follows. Confirm the complimentary account still resolves to Pro with no purchase.
- **Regression:** a real Stripe web checkout for each of the three plans, confirming the correct tier lands (this is the current bug's fix).

## 15. Rejection risks

- **Apple 3.1.1** — any path where a native user can reach Stripe Checkout for a subscription. Mitigation: platform gate plus removing external upgrade links from native builds.
- **Apple 3.1.1 / anti-steering** — the native app must not tell users the web is cheaper or link them to web pricing to subscribe. Existing marketing copy on Pricing/Landing needs a native-only variant.
- Missing restore mechanism, prices that don't match the store, or advertising a trial the store doesn't offer.
- Incomplete IAP metadata/screenshots, or products still in "Prepare for Submission" at review time.
- **Play Payments policy** — same external-payment issue on Android for digital goods.
- Unacknowledged Google purchases auto-refunding after 3 days and looking like broken billing.
- The bundled-assets architecture is fine (not a "webview wrapper" rejection), so no change there.

## 16. Phased implementation plan (safest order)

**Phase 0 — Fix the existing bug, no native code.** Make `startCheckout(plan)` and `create-checkout` honor the selected plan with three real Stripe prices; add plan→product mapping to `check-subscription`. Web-only, immediately valuable, zero native risk.

**Phase 1 — Entitlement layer.** Migration for `public.subscriptions` (+ RLS, grants, indexes), `_shared/entitlements.ts`, rewrite `check-subscription` to return the normalized payload while keeping backward-compatible fields, and backfill existing Stripe + complimentary users. Verify no current subscriber loses access.

**Phase 2 — Platform detection + UI shaping.** `src/lib/billing/*`, native-safe Pricing page (store prices, no trial copy, no external-payment links), provider-aware Account page. Native still shows "manage on web" until Phase 3 lands.

**Phase 3 — Apple.** Install the billing plugin, `verify-apple-purchase` + `apple-subscription-webhook`, restore purchases, sandbox → TestFlight validation.

**Phase 4 — Android.** `verify-google-purchase` + `google-subscription-webhook` + acknowledgement, internal-track validation.

**Phase 5 — Trials and polish.** Enable trial copy per platform only after the store offers exist; add upgrade/downgrade proration; documentation updates in `IOS_CONVERSION.md` / `ANDROID_CONVERSION.md`.

## 17. Decisions I need from you before Phase 3

1. **RevenueCat or raw StoreKit/Play Billing?** RevenueCat is materially less code and less cryptographic risk; raw means no third-party dependency or pricing tier but we hand-implement JWS chain verification and Play service-account auth.
2. **Three Stripe prices** — do they already exist for $9/$19/$39, or should I create the products and prices?
3. **API $99 tier on native** — hide it, or show it as contact-sales (allowed since it isn't purchasable in-app)?
