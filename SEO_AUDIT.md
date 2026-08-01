# SEO Audit — PixelSqueeze

Verified against the running app (Chromium, 428px viewport) and the shipped
static files.

## Route verification (measured)

Every public route returns HTTP 200, renders exactly **one** `<h1>`, ships a
unique `<title>`, and has **no** horizontal overflow at 428px:

| Route | Title (truncated) | H1 count | Overflow | Console errors |
| --- | --- | --- | --- | --- |
| `/` | Make Every Photo Look Amazing — PixelSqueeze | 1 | no | 0 |
| `/pricing` | Pricing — PixelSqueeze AI Photo Enhancer | 1 | no | 0 |
| `/scanner` | Website Image Scanner — PixelSqueeze | 1 | no | 0 |
| `/blog` | PixelSqueeze Blog — AI Image, SEO & Marketing… | 1 | no | 0 |
| `/learn` | PixelSqueeze Learn — The Image Optimization… | 1 | no | 0 |
| `/for` | PixelSqueeze Solutions by Industry | 1 | no | 0 |
| `/enhance` | AI Image Enhancement Tools — Upscale, Sharpen… | 1 | no | 0 |
| `/tools/seo-image-optimizer` | SEO Image Optimizer — AI Alt Text, Schema… | 1 | no | 0 |
| `/tools/photo-optimizer` | AI Photo Optimizer — Optimize Photos… | 1 | no | 0 |
| `/company`, `/privacy`, `/install`, `/auth` | unique per page | 1 | no | 0 |
| unknown path | Page Not Found — PixelSqueeze | 1 | no | expected 404 log |

## Fixed this pass

| Issue | Fix |
| --- | --- |
| Fabricated `aggregateRating` (4.9 / 2,847) and `review` markup on 6 surfaces — violates Google's self-serving review policy and caused the Search Console `itemReviewed` / `reviewCount` errors | All `aggregateRating` and `review` nodes removed from JSON-LD site-wide. Remaining schema (`WebApplication`, `SoftwareApplication`, `Organization`, `FAQPage`, `BreadcrumbList`, `HowTo`, `Article`) is factual |
| PWA manifest shortcut pointed at `/index`, a route that did not exist → shortcut landed on the 404 page | Shortcut now targets `/dashboard`; a `/index → /dashboard` redirect route was added so existing installs and old deep links still resolve |
| `sitemap.xml` carried an identical `<lastmod>` on all 107 URLs, derived from generation date rather than page content | `<lastmod>` removed entirely; the sitemap now advertises only authoritative `<loc>`/`<changefreq>`/`<priority>` |
| Canonical and `og:url` used `https://pixelsqueeze.app` (no trailing slash) while the sitemap advertises `https://pixelsqueeze.app/` | Normalised to the trailing-slash form so they self-reference the same URL the sitemap declares |
| Obsolete meta noise (`revisit-after`, `distribution`, `rating`) — ignored by all major engines | Removed |
| `/reset-password` was crawlable | Added to `robots.txt` `Disallow` |

## Verified compliant

- `robots.txt`: `Allow: /` for all agents, private surfaces disallowed
  (`/dashboard`, `/account`, `/admin`, `/auth`, `/success`, `/share/`,
  `/reset-password`), `Sitemap:` directive present and correct.
- `sitemap.xml`: 107 URLs, all absolute `https://pixelsqueeze.app` paths.
- Open Graph + Twitter Cards complete site-wide with a real 1200×630 `og-image.png`.
- Per-route head handled by `src/components/SEO.tsx`; a single sitewide canonical
  in `index.html` is superseded per route.
- Semantic landmarks (`<main id="main-content">`, `<article>`, `<nav>`), skip link
  present, breadcrumbs emit `BreadcrumbList`.
- `public/llms.txt` present for AI crawlers.
- Mobile-first: no viewport overflow on any tested route; viewport allows
  pinch-zoom (`maximum-scale=5.0`).
- Internal linking: industry (`/for/*`), keyword (`/enhance/*`) and authority
  (`/learn/*`) clusters cross-link into the tool pages.

## Known limits

- The app is a client-rendered SPA. JS-executing crawlers (Googlebot) see
  per-route metadata; non-executing social scrapers only see the static
  `index.html` head. Accurate per-page social previews would require SSR.
- Visible testimonial copy on the landing page remains marketing content; it is
  deliberately **no longer** marked up as review structured data.
