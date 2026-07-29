import type { DaylightContext } from "@/features/trailpack/types";

export type ForecastTimelineMarkerKind =
  | "first-light"
  | "sunrise"
  | "start"
  | "sunset"
  | "last-light";

export interface ForecastTimelineMarker {
  id: string;
  kind: ForecastTimelineMarkerKind;
  label: string;
  time: string;
  hour: number;
  minute: number;
}

interface ClockTime {
  hour: number;
  minute: number;
}

export function buildForecastTimelineMarkers({
  daylight,
  startTime,
}: {
  daylight?: DaylightContext;
  startTime?: string;
}): ForecastTimelineMarker[] {
  const markers: ForecastTimelineMarker[] = [];

  addIsoMarker(markers, "first-light", "First light", daylight?.civilTwilightBegin);
  addIsoMarker(markers, "sunrise", "Sunrise", daylight?.sunrise);

  const parsedStart = parseUserClock(startTime);
  if (parsedStart) {
    markers.push(toMarker("start", "Your start", parsedStart));
  }

  addIsoMarker(markers, "sunset", "Sunset", daylight?.sunset);
  addIsoMarker(markers, "last-light", "Last light", daylight?.civilTwilightEnd);

  return markers.sort(
    (left, right) =>
      left.hour * 60 + left.minute - (right.hour * 60 + right.minute),
  );
}

function addIsoMarker(
  markers: ForecastTimelineMarker[],
  kind: ForecastTimelineMarkerKind,
  label: string,
  value: string | undefined,
) {
  const time = parseIsoClock(value);
  if (time) {
    markers.push(toMarker(kind, label, time));
  }
}

function toMarker(
  kind: ForecastTimelineMarkerKind,
  label: string,
  time: ClockTime,
): ForecastTimelineMarker {
  return {
    id: `${kind}-${time.hour}-${time.minute}`,
    kind,
    label,
    time: formatClock(time),
    hour: time.hour,
    minute: time.minute,
  };
}

function parseIsoClock(value: string | undefined): ClockTime | null {
  const match = value?.match(/T(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return validateClock(
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10),
  );
}

function parseUserClock(value: string | undefined): ClockTime | null {
  const match = value
    ?.trim()
    .match(/^(\d{1,2})(?::(\d{2})(?::\d{2})?)?\s*(am|pm)?$/i);
  if (!match) {
    return null;
  }

  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();
  let hour = Number.parseInt(match[1], 10);

  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    hour %= 12;
    if (meridiem === "pm") {
      hour += 12;
    }
  }

  return validateClock(hour, minute);
}

function validateClock(hour: number, minute: number): ClockTime | null {
  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  return { hour, minute };
}

function formatClock({ hour, minute }: ClockTime): string {
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
}
