import { AuthStatusNotice } from "@/features/trailpack/components/AuthStatusNotice";
import { TrailPackShell } from "@/features/trailpack/components/TrailPackShell";

export default function Home() {
  return (
    <>
      <AuthStatusNotice />
      <TrailPackShell />
    </>
  );
}
