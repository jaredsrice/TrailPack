import { handleNpsLookupPost } from "@/features/trailpack/lib/nps-lookup-route";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return handleNpsLookupPost(request);
}
