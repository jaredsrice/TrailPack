import { NextResponse, type NextRequest } from "next/server";
import { SUPPORTED_TRAILS } from "@/features/trailpack/data/supported-trails";
import { fetchOpenMeteoWeatherContext } from "@/features/trailpack/lib/external-context";

export async function GET(request: NextRequest) {
  const trailId = request.nextUrl.searchParams.get("trailId");

  if (!trailId) {
    return NextResponse.json(
      { error: "Missing trailId query parameter." },
      { status: 400 },
    );
  }

  if (!SUPPORTED_TRAILS[trailId]) {
    return NextResponse.json(
      { error: "Unsupported trailId query parameter." },
      { status: 400 },
    );
  }

  const weather = await fetchOpenMeteoWeatherContext(trailId);

  if (!weather) {
    return NextResponse.json(
      { error: "Weather context is unavailable for this trail." },
      { status: 503 },
    );
  }

  return NextResponse.json(weather);
}
