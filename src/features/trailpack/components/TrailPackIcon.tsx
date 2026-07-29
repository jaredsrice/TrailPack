import type { ReactNode, SVGProps } from "react";

export type TrailPackIconName =
  | "alert"
  | "calendar"
  | "chevron"
  | "clock"
  | "difficulty"
  | "distance"
  | "elevation"
  | "info"
  | "logo"
  | "plus"
  | "search"
  | "shield"
  | "sparkles"
  | "source"
  | "trail"
  | "weather";

export function TrailPackIcon({
  name,
  className = "h-5 w-5",
  ...props
}: {
  name: TrailPackIconName;
  className?: string;
} & Omit<SVGProps<SVGSVGElement>, "children">) {
  const paths = iconPaths[name];

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {paths}
    </svg>
  );
}

const iconPaths: Record<TrailPackIconName, ReactNode> = {
  alert: (
    <>
      <path d="M12 3.4 21 19H3z" />
      <path d="M12 9v4.5M12 17h.01" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M7.5 3v4M16.5 3v4M3.5 9.5h17" />
    </>
  ),
  chevron: <path d="m7 9 5 5 5-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  difficulty: (
    <>
      <path d="M4 19v-4h3v4M10.5 19v-8h3v8M17 19V6h3v13" />
      <path d="M2.5 19.5h19" />
    </>
  ),
  distance: (
    <>
      <path d="M5.5 21c0-4 3-5.8 3-9.3a3.5 3.5 0 1 1 7 0c0 3.5 3 5.3 3 9.3" />
      <circle cx="12" cy="11.5" r="1.2" />
      <path d="M2.5 21h19" />
    </>
  ),
  elevation: (
    <>
      <path d="m3 19 6.2-11 3.3 5 2.2-3.2L21 19z" />
      <path d="m7.8 10.5 1.6 1.2 1.5-1.4M13.7 11.3l1.3 1.2 1.4-1.1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10.5V17M12 7h.01" />
    </>
  ),
  logo: (
    <>
      <path d="M3.2 16.5 8.7 9l3.1 3.8 2.7-3.2 6.3 6.9" />
      <path d="m8.7 9 2.6-3.5 3.2 4.1" />
      <path d="M4 18.8h16" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5.2c0 4.4 2.9 7.8 7 9.8 4.1-2 7-5.4 7-9.8V6z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 3.5 13 7l3.5 1L13 9l-1 3.5L11 9 7.5 8 11 7z" />
      <path d="m18 14 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7z" />
      <path d="m5.5 12 .5 1.5 1.5.5-1.5.5L5.5 16 5 14.5 3.5 14l1.5-.5z" />
    </>
  ),
  source: (
    <>
      <path d="M6 3.5h8l4 4V20.5H6z" />
      <path d="M14 3.5v4h4M9 12h6M9 15.5h6" />
    </>
  ),
  trail: (
    <>
      <path d="M5 21c0-4.3 5-4.2 5-8.1 0-2.4-1.9-3.2-1.9-5.1 0-1.7 1.3-3.1 3.3-4.3" />
      <path d="M15.5 3.7 19 8l-3.5 4.3" />
      <path d="M14.5 8H19" />
    </>
  ),
  weather: (
    <>
      <path d="M8 17.5H6.7a4.2 4.2 0 1 1 1-8.3A5.8 5.8 0 0 1 18.6 12a3 3 0 0 1-1 5.5H8Z" />
      <path d="M14.8 4.2V2.5M18 5.5l1.2-1.2M11.6 5.5l-1.2-1.2" />
    </>
  ),
};
