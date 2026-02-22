import { useEffect } from "react";

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref"] as const;
const STORAGE_KEY = "pixelsqueeze_utm";

export interface UtmData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  ref?: string;
  landing_page?: string;
  first_visit?: string;
}

/** Capture UTM params from the URL on first visit and persist them in localStorage */
export function useUtmTracking() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm: UtmData = {};
    let hasUtm = false;

    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) {
        utm[key] = value;
        hasUtm = true;
      }
    }

    if (hasUtm) {
      utm.landing_page = window.location.pathname;
      utm.first_visit = new Date().toISOString();

      // Don't overwrite existing UTM data (first-touch attribution)
      const existing = localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(utm));
      }
    }
  }, []);
}

/** Retrieve stored UTM data */
export function getUtmData(): UtmData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Build a shareable URL with UTM params */
export function buildUtmLink(
  baseUrl: string,
  source: string,
  medium: string,
  campaign: string,
  content?: string
): string {
  const url = new URL(baseUrl);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  if (content) url.searchParams.set("utm_content", content);
  return url.toString();
}
