import type {
  AlertContext,
  RetrievalStatus,
  SourceLabel,
} from "@/features/trailpack/types";
import {
  discardBody,
  readTextWithinLimit,
} from "@/features/trailpack/lib/read-text-with-limit";

const ALERTS_ROUTE = "/api/trailpack/alerts";
const REQUEST_ERROR_MESSAGE =
  "TrailPack could not load the live NPS alerts.";
const MAX_ALERTS = 10;
const MAX_STRING_LENGTH = 2_000;
const MAX_STATUS_REASON_LENGTH = 500;
const MAX_RESPONSE_BYTES = 64_000;
const RETRIEVAL_STATUSES = new Set<RetrievalStatus>([
  "live",
  "saved-fixture",
  "unavailable",
]);
const ALERT_LABELS = new Set<SourceLabel>(["official", "unavailable"]);
const ALERT_SEVERITIES = new Set<
  NonNullable<AlertContext["alerts"][number]["severity"]>
>(["info", "caution", "closure"]);

interface RequestTrailAlertsOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export async function requestTrailAlerts(
  trailId: string,
  options: RequestTrailAlertsOptions = {},
): Promise<AlertContext> {
  const params = new URLSearchParams({ trailId });

  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(
      `${ALERTS_ROUTE}?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal: options.signal,
      },
    );
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  if (!response.ok) {
    await discardBody(response);
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  let responseBody: unknown;
  try {
    const responseRead = await readTextWithinLimit(response, MAX_RESPONSE_BYTES);
    if (responseRead.status !== "ok") {
      throw new Error(REQUEST_ERROR_MESSAGE);
    }
    responseBody = JSON.parse(responseRead.text);
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  const alerts = parseAlertContextResponse(responseBody);
  if (!alerts) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  return alerts;
}

export function parseAlertContextResponse(value: unknown): AlertContext | null {
  if (
    !isRecord(value) ||
    typeof value.hasActiveAlerts !== "boolean" ||
    !Array.isArray(value.alerts) ||
    value.alerts.length > MAX_ALERTS ||
    !ALERT_LABELS.has(value.label as SourceLabel) ||
    !isRetrievalStatus(value.retrievalStatus) ||
    (value.retrievalStatus === "live" && value.label !== "official") ||
    (value.retrievalStatus === "unavailable" && value.label !== "unavailable") ||
    !isOptionalString(value.statusReason, MAX_STATUS_REASON_LENGTH)
  ) {
    return null;
  }

  const alerts: AlertContext["alerts"] = [];
  for (const alert of value.alerts) {
    if (
      !isRecord(alert) ||
      !isRequiredString(alert.title) ||
      !isRequiredString(alert.description) ||
      alert.source !== "NPS" ||
      !isOptionalSeverity(alert.severity) ||
      !isOptionalNpsUrl(alert.sourceUrl)
    ) {
      return null;
    }

    alerts.push({
      title: alert.title,
      description: alert.description,
      severity: alert.severity,
      source: "NPS",
      sourceUrl: alert.sourceUrl,
    });
  }

  if (value.hasActiveAlerts !== (alerts.length > 0)) {
    return null;
  }

  return {
    hasActiveAlerts: value.hasActiveAlerts,
    alerts,
    label: value.label as Extract<SourceLabel, "official" | "unavailable">,
    retrievalStatus: value.retrievalStatus,
    statusReason: value.statusReason,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRequiredString(
  value: unknown,
  maxLength: number = MAX_STRING_LENGTH,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isOptionalString(
  value: unknown,
  maxLength: number,
): value is string | undefined {
  return value === undefined || isRequiredString(value, maxLength);
}

function isRetrievalStatus(value: unknown): value is RetrievalStatus {
  return (
    typeof value === "string" &&
    RETRIEVAL_STATUSES.has(value as RetrievalStatus)
  );
}

function isOptionalSeverity(
  value: unknown,
): value is AlertContext["alerts"][number]["severity"] {
  return (
    value === undefined ||
    (typeof value === "string" &&
      ALERT_SEVERITIES.has(
        value as NonNullable<AlertContext["alerts"][number]["severity"]>,
      ))
  );
}

function isOptionalNpsUrl(value: unknown): value is string | undefined {
  if (value === undefined) {
    return true;
  }
  if (typeof value !== "string" || value.length > MAX_STRING_LENGTH) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
      (host === "nps.gov" || host.endsWith(".nps.gov"))
    );
  } catch {
    return false;
  }
}
