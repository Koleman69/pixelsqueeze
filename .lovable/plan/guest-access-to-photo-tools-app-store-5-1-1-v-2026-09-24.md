# Guest access to photo tools (App Store 5.1.1(v))

## Goal
Anyone can open the app and use photo tools (compress, optimize, enhance, crop, background removal) without signing up or giving an email. Signing in is only asked for account features.

## What changes for users
- Landing and sign-in screens get a clear "Continue without an account" button that opens the tools dashboard.
- The dashboard opens for guests. Header/sidebar show "Sign in" instead of account options.
- The "enter your email to unlock" step on free tools is removed. Guests get the free credits per device automatically.
- Account-only items (cloud share links, saved files, subscriptions/upgrade, automation, social posting, account settings, delete account, log out) show a friendly "Sign in to use this" prompt instead of blocking the whole app.
- In the iOS/Android app, the first screen offers both "Get started free" (guest) and "Sign in".

## Technical details
- `App.tsx`: remove `ProtectedRoute` from `/dashboard`; keep it on `/account`, `/admin`, `/success`. `/` still redirects signed-in users to dashboard.
- `FreeToolGate.tsx`: drop the email requirement; usage keyed by the existing device token (`get_free_tool_usage` / `consume_free_tool_usage` already use it). Keep the free-limit/upgrade screen.
- `Index.tsx`: guard `checkSubscription` and email-dependent logic on `user`; header shows Sign in button when guest.
- `DashboardSidebar.tsx` / `MobileDashboardNav.tsx`: render `AccountActions`/Log out/Delete only when signed in; otherwise a Sign in entry.
- Add a small `RequireAccount` wrapper used around account-based tools (sharing, files, automation, social, competitor, admin content) showing a sign-in card.
- Audit edge functions used by guest tools (compress, analyze, ai-edit) to confirm they accept anonymous calls with device-token quotas; fix any that reject guests.
- Landing + Auth pages: add "Continue without an account" link to `/dashboard`.
- Verify with Playwright signed-out at iPad size: open app, reach dashboard, compress and download an image with no sign-in prompt.

## Review note
Reply to Apple stating photo tools are now available without registration; sign-in is only required for cloud sharing and saved files. In-app subscriptions (App Store / Google Play) can be bought and restored without an account: the purchase unlocks Pro on the device right away, and if the person signs in later it is linked to their account (backend accepts a device token when no login is present).
