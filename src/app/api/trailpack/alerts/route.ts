import { NextResponse, type NextRequest } from "next/server";
import {
  fetchNpsAlertContext,
  resolveSupportedParkCode,
} from "@/features/trailpack/lib/external-context";

export async function GET(request: NextRequest) {
  const parkCode = resolveSupportedParkCode({
    trailId: request.nextUrl.searchParams.get("trailId"),
    parkCode: request.nextUrl.searchParams.get("parkCode"),
  });

  if (!parkCode) {
    return NextResponse.json(
      { error: "Provide a supported trailId or parkCode." },
      { status: 400 },
    );
  }

  const alerts = await fetchNpsAlertContext(parkCode, process.env.NPS_API_KEY);

  return NextResponse.json(alerts);
}
