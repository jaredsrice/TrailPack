import { handleAiReviewPost } from "@/features/trailpack/lib/ai-review-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleAiReviewPost(request);
}
