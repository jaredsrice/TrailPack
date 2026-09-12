import type { TrailProfile } from "../types";
import type { NpsPageSnapshot } from "./nps-source-integrity";
import { discardBody, readTextWithinLimit } from "./read-text-with-limit";

const MAX_HTML_BYTES = 1_000_000;
const REQUEST_TIMEOUT_MS = 20_000;
const USER_AGENT =
  "TrailPack-source-integrity/0.1 (+https://github.com/jaredsrice/TrailPack)";

function isOfficialNpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !url.username && !url.password && !url.port &&
      (url.hostname === "nps.gov" || url.hostname.endsWith(".nps.gov"))
    );
  } catch {
    return false;
  }
}

export async function fetchNpsPage(profile: TrailProfile, fetchImpl: typeof fetch = fetch): Promise<NpsPageSnapshot> {
  if (!isOfficialNpsUrl(profile.npsSourceUrl)) {
    return {
      trailId: profile.id,
      sourceUrl: profile.npsSourceUrl,
      error: "Saved source URL is not an official HTTPS nps.gov address.",
    };
  }

  try {
    // Reviewed September 12, 2026: www serves a page shell for this one
    // source, while NPS's home host serves the full, matching canonical page.
    // Keep the saved identity and report the delivery URL separately.
    let requestUrl = profile.npsSourceUrl === "https://www.nps.gov/thingstodo/open-canyon.htm"
      && (profile.id === "open-canyon" || profile.id === "open-canyon-rendezvous")
      ? "https://home.nps.gov/thingstodo/open-canyon.htm"
      : profile.npsSourceUrl;
    const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
    const requestOptions: RequestInit = {
      redirect: "manual",
      signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "Cache-Control": "no-cache",
        "User-Agent": USER_AGENT,
      },
    };
    let response = await fetchImpl(requestUrl, requestOptions);
    for (let redirects = 0; [301, 302, 303, 307, 308].includes(response.status); redirects++) {
      await discardBody(response);
      const location = response.headers.get("location");
      const target = location ? new URL(location, requestUrl).href : "";
      if (redirects >= 3 || !isOfficialNpsUrl(target)) {
        return {
          trailId: profile.id,
          sourceUrl: profile.npsSourceUrl,
          finalUrl: requestUrl,
          httpStatus: response.status,
          error: "NPS redirect was missing, outside official HTTPS NPS hosts, or exceeded the redirect limit.",
        };
      }
      requestUrl = target;
      response = await fetchImpl(requestUrl, requestOptions);
    }

    if (!response.ok) {
      await discardBody(response);
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: `NPS returned HTTP ${response.status}.`,
      };
    }

    if (!isOfficialNpsUrl(response.url)) {
      await discardBody(response);
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: "NPS redirected the saved source to a non-NPS address.",
      };
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("text/html")) {
      await discardBody(response);
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: `Expected an HTML response but received ${contentType || "an unknown content type"}.`,
      };
    }

    const read = await readTextWithinLimit(response, MAX_HTML_BYTES, signal);
    if (read.status !== "ok") {
      return {
        trailId: profile.id,
        sourceUrl: profile.npsSourceUrl,
        finalUrl: response.url,
        httpStatus: response.status,
        error: read.status === "too-large"
          ? `NPS page exceeded the ${MAX_HTML_BYTES.toLocaleString("en-US")}-byte safety limit.`
          : "NPS page could not be read within the request deadline.",
      };
    }

    return {
      trailId: profile.id,
      sourceUrl: profile.npsSourceUrl,
      finalUrl: response.url,
      httpStatus: response.status,
      html: read.text,
    };
  } catch (error) {
    return {
      trailId: profile.id,
      sourceUrl: profile.npsSourceUrl,
      error: error instanceof Error ? error.message : "Unknown NPS request failure.",
    };
  }
}
