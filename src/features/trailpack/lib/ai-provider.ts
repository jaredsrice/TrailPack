import {
  buildGuardedAiFallback,
  type AiContractInput,
  type LiveAiOutcome,
  type LiveAiReviewResult,
} from "@/features/trailpack/lib/ai-contract";
import { approvedReviewFacts, parseApprovedSelection, resolveApprovedReview } from "./ai-approved-review";
import {
  discardBody,
  readTextWithinLimit,
} from "@/features/trailpack/lib/read-text-with-limit";

export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash";
export const DEFAULT_AI_TIMEOUT_MS = 25_000;

const GEMINI_INTERACTIONS_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const MAX_PROVIDER_RESPONSE_LENGTH = 256_000;
const MAX_PROVIDER_ERROR_DIAGNOSTIC_LENGTH = 8_192;

type ProviderErrorEnvelope =
  | "nested-error"
  | "flat-error"
  | "json-array"
  | "json-null"
  | "json-primitive"
  | "non-json"
  | "oversized";

interface SafeProviderFailureDiagnostic {
  httpStatus: number;
  providerEnvelope?: ProviderErrorEnvelope;
  providerStatus?: string;
  providerReason?: string;
  invalidFields?: string[];
}

const AI_REVIEW_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summaryIds: {
      type: "array",
      items: { type: "string" },
      description: "Select one to three unique IDs from the supplied approved facts, in useful reading order.",
    },
  },
  required: ["summaryIds"],
} as const;

export interface LiveAiProviderOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export async function requestLiveAiReview(
  input: AiContractInput,
  options: LiveAiProviderOptions = {},
): Promise<LiveAiReviewResult> {
  const model = normalizeModel(options.model);
  const provider = { name: "gemini" as const, model };
  const apiKey = options.apiKey?.trim();

  if (!apiKey) {
    return fallbackResult(
      input,
      provider,
      "missing-key",
      "Live AI configuration is unavailable; the rule-based fallback remains active.",
    );
  }

  const timeoutMs = normalizeTimeout(options.timeoutMs);
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const response = await (options.fetchImpl ?? fetch)(
      GEMINI_INTERACTIONS_ENDPOINT,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(buildGeminiInteractionRequest(input, model)),
        signal: controller.signal,
      },
    );

    if (response.status === 429) {
      await discardBody(response);
      return fallbackResult(
        input,
        provider,
        "quota-limited",
        "Live AI quota is unavailable; the rule-based fallback remains active.",
      );
    }

    if (response.status === 408 || response.status === 504) {
      await discardBody(response);
      return fallbackResult(
        input,
        provider,
        "timed-out",
        "Live AI timed out; the rule-based fallback remains active.",
      );
    }

    if (!response.ok) {
      await logSafeGeminiFailure(response);
      return fallbackResult(
        input,
        provider,
        "provider-error",
        "Live AI is unavailable; the rule-based fallback remains active.",
      );
    }

    const draft = await readGeminiDraft(response);
    if (!draft) {
      return fallbackResult(
        input,
        provider,
        timedOut ? "timed-out" : "invalid-response",
        timedOut
          ? "Live AI timed out; the rule-based fallback remains active."
          : "Live AI returned an invalid response; the rule-based fallback remains active.",
      );
    }

    const guarded = resolveApprovedReview(input, draft);
    if (guarded.status === "accepted") {
      return {
        outcome: "accepted",
        provider,
        review: guarded,
      };
    }

    return {
      outcome: "rejected",
      provider,
      review: guarded,
    };
  } catch (error) {
    if (timedOut || isAbortError(error)) {
      return fallbackResult(
        input,
        provider,
        "timed-out",
        "Live AI timed out; the rule-based fallback remains active.",
      );
    }

    return fallbackResult(
      input,
      provider,
      "provider-error",
      "Live AI is unavailable; the rule-based fallback remains active.",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function logSafeGeminiFailure(response: Response): Promise<void> {
  if (!process.env.VERCEL_ENV) {
    await discardBody(response);
    return;
  }

  const diagnostic: SafeProviderFailureDiagnostic = {
    httpStatus: response.status,
  };

  try {
    const responseRead = await readTextWithinLimit(
      response,
      MAX_PROVIDER_ERROR_DIAGNOSTIC_LENGTH,
    );
    if (responseRead.status === "too-large") {
      diagnostic.providerEnvelope = "oversized";
    } else if (responseRead.status === "ok") {
      const responseBody: unknown = JSON.parse(responseRead.text);
      if (isRecord(responseBody)) {
        diagnostic.providerEnvelope = isRecord(responseBody.error)
          ? "nested-error"
          : "flat-error";
        readSafeProviderErrorRecord(responseBody, diagnostic);
      } else if (Array.isArray(responseBody)) {
        diagnostic.providerEnvelope = "json-array";
        const firstError = responseBody.find(isRecord);
        if (firstError) {
          readSafeProviderErrorRecord(firstError, diagnostic);
        }
      } else if (responseBody === null) {
        diagnostic.providerEnvelope = "json-null";
      } else {
        diagnostic.providerEnvelope = "json-primitive";
        diagnostic.providerReason = classifyProviderMessage(responseBody);
      }
    } else {
      diagnostic.providerEnvelope = "non-json";
    }
  } catch {
    diagnostic.providerEnvelope = "non-json";
  }

  console.warn("TrailPack Gemini provider request failed.", diagnostic);
}

function readSafeProviderErrorRecord(
  envelope: Record<string, unknown>,
  diagnostic: SafeProviderFailureDiagnostic,
): void {
  const errorBody = isRecord(envelope.error) ? envelope.error : envelope;
  diagnostic.providerStatus = safeProviderCode(errorBody.status);
  diagnostic.providerReason =
    safeProviderCode(errorBody.reason) ??
    safeProviderCode(errorBody.type) ??
    safeProviderCode(errorBody.code) ??
    safeProviderCode(envelope.error) ??
    classifyProviderMessage(errorBody.message);

  if (!Array.isArray(errorBody.details)) {
    return;
  }

  const invalidFields = errorBody.details
    .filter(
      (detail) =>
        isRecord(detail) &&
        typeof detail["@type"] === "string" &&
        detail["@type"].endsWith("BadRequest") &&
        Array.isArray(detail.fieldViolations),
    )
    .flatMap((detail) =>
      isRecord(detail) && Array.isArray(detail.fieldViolations)
        ? detail.fieldViolations
        : [],
    )
    .filter(isRecord)
    .map((violation) => safeProviderField(violation.field))
    .filter((field): field is string => Boolean(field));

  if (invalidFields.length > 0) {
    diagnostic.invalidFields = [...new Set(invalidFields)].slice(0, 8);
  }

  const errorInfo = errorBody.details.find(
    (detail) =>
      isRecord(detail) &&
      typeof detail["@type"] === "string" &&
      detail["@type"].endsWith("ErrorInfo"),
  );
  if (isRecord(errorInfo)) {
    diagnostic.providerReason =
      safeProviderCode(errorInfo.reason) ?? diagnostic.providerReason;
  }
}

function buildGeminiInteractionRequest(
  input: AiContractInput,
  model: string,
) {
  return {
    model,
    input: buildPrompt(input),
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: AI_REVIEW_RESPONSE_SCHEMA,
    },
    store: false,
  };
}

function buildPrompt(input: AiContractInput): string {
  return [
    "Select the one to three most useful planning highlights from the approved facts.",
    "Return exactly one JSON object with summaryIds: an array of unique supplied IDs.",
    "Do not write prose or add keys. Do not invent IDs. Keep packing decisions unchanged.",
    JSON.stringify({ approvedFacts: approvedReviewFacts(input) }),
  ].join("\n");
}

async function readGeminiDraft(response: Response) {
  const responseRead = await readTextWithinLimit(
    response,
    MAX_PROVIDER_RESPONSE_LENGTH,
  );
  if (responseRead.status !== "ok") {
    return null;
  }
  const responseText = responseRead.text;

  let responseBody: unknown;
  try {
    responseBody = JSON.parse(responseText);
  } catch {
    return null;
  }

  const generatedText = extractGeneratedText(responseBody);
  if (
    !generatedText ||
    generatedText.length > MAX_PROVIDER_RESPONSE_LENGTH
  ) {
    return null;
  }

  let generatedValue: unknown;
  try {
    generatedValue = JSON.parse(generatedText);
  } catch {
    return null;
  }

  return parseApprovedSelection(generatedValue);
}

function extractGeneratedText(value: unknown): string | null {
  if (
    !isRecord(value) ||
    value.status !== "completed" ||
    !Array.isArray(value.steps)
  ) {
    return null;
  }

  const textParts = value.steps
    .filter(isRecord)
    .filter((step) => step.type === "model_output")
    .flatMap((step) => (Array.isArray(step.content) ? step.content : []))
    .filter(isRecord)
    .filter((content) => content.type === "text")
    .map((content) => content.text)
    .filter((text): text is string => typeof text === "string");

  return textParts.length > 0 ? textParts.join("") : null;
}

function fallbackResult(
  input: AiContractInput,
  provider: LiveAiReviewResult["provider"],
  outcome: Exclude<LiveAiOutcome, "accepted" | "rejected">,
  reason: string,
): LiveAiReviewResult {
  return {
    outcome,
    provider,
    review: buildGuardedAiFallback(input, [reason]),
  };
}

function normalizeModel(model?: string): string {
  const candidate = model?.trim();
  if (
    candidate &&
    candidate.length <= 100 &&
    /^gemini-[a-z0-9.-]+$/.test(candidate)
  ) {
    return candidate;
  }

  return DEFAULT_GEMINI_MODEL;
}

function normalizeTimeout(timeoutMs?: number): number {
  if (
    typeof timeoutMs === "number" &&
    Number.isFinite(timeoutMs) &&
    timeoutMs >= 1 &&
    timeoutMs <= 30_000
  ) {
    return timeoutMs;
  }

  return DEFAULT_AI_TIMEOUT_MS;
}



function safeProviderCode(value: unknown): string | undefined {
  return typeof value === "string" && /^[A-Za-z0-9_.-]{1,80}$/.test(value)
    ? value.toUpperCase()
    : undefined;
}

function safeProviderField(value: unknown): string | undefined {
  return typeof value === "string" &&
    value.length <= 160 &&
    /^[A-Za-z0-9_.[\]-]+$/.test(value)
    ? value
    : undefined;
}

function classifyProviderMessage(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (
    normalized.includes("api key not valid") ||
    normalized.includes("api_key_invalid")
  ) {
    return "API_KEY_INVALID";
  }
  if (normalized.includes("invalid json payload")) {
    return "INVALID_ARGUMENT";
  }
  if (normalized.trim() === "bad request") {
    return "BAD_REQUEST";
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}
