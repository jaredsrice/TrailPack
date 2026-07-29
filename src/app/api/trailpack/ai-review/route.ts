import { parseAiContractInput } from "@/features/trailpack/lib/ai-contract-runtime";
import { requestLiveAiReview } from "@/features/trailpack/lib/ai-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 64_000;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_REQUEST_BYTES
  ) {
    return jsonResponse(
      { error: "AI review request is too large." },
      { status: 413 },
    );
  }

  let requestText: string;
  try {
    requestText = await request.text();
  } catch {
    return jsonResponse(
      { error: "Unable to read AI review request." },
      { status: 400 },
    );
  }

  if (new TextEncoder().encode(requestText).byteLength > MAX_REQUEST_BYTES) {
    return jsonResponse(
      { error: "AI review request is too large." },
      { status: 413 },
    );
  }

  let requestValue: unknown;
  try {
    requestValue = JSON.parse(requestText);
  } catch {
    return jsonResponse(
      { error: "AI review request must be valid JSON." },
      { status: 400 },
    );
  }

  const input = parseAiContractInput(requestValue);
  if (!input) {
    return jsonResponse(
      { error: "AI review request does not match the supported contract." },
      { status: 400 },
    );
  }

  const result = await requestLiveAiReview(input, {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  });

  return jsonResponse(result);
}

function jsonResponse(
  body: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);

  return Response.json(body, {
    ...init,
    headers,
  });
}
