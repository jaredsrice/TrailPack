import { NextResponse, type NextRequest } from "next/server";
import { TRAIL_CATALOG } from "@/features/trailpack/data/supported-trails";
import { fetchOpenMeteoWeatherContext } from "@/features/trailpack/lib/external-context";

export async function GET(request: NextRequest) {
  const trailId = request.nextUrl.searchParams.get("trailId");
  const plannedDate = request.nextUrl.searchParams.get("date");

  if (!trailId) {
    return NextResponse.json(
      { error: "Missing trailId query parameter." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!TRAIL_CATALOG[trailId]) {
    return NextResponse.json(
      { error: "Unsupported trailId query parameter." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (plannedDate && !isValidIsoDate(plannedDate)) {
    return NextResponse.json(
      { error: "Invalid date query parameter." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const weather = await fetchOpenMeteoWeatherContext(trailId, {
    plannedDate: plannedDate ?? undefined,
  });

  if (!weather) {
    return NextResponse.json(
      { error: "Weather context is unavailable for this trail." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(weather, {
    headers: { "Cache-Control": "no-store" },
  });
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}
