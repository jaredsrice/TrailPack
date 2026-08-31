import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function migration(name: string): string {
  return readFileSync(
    new URL(`../../supabase/migrations/${name}`, import.meta.url),
    "utf8",
  );
}

const savedResults = migration("20260730000000_create_saved_results.sql");
const savedLimits = migration("20260827000000_harden_saved_results_limits.sql");
const aiQuota = migration("20260830000000_dedupe_ai_review_generations.sql");

describe("database boundary migrations", () => {
  it("keeps saved results owner-scoped and bounded under direct authenticated access", () => {
    expect(savedResults).toContain(
      "alter table public.saved_results enable row level security",
    );
    expect(
      savedResults.match(/\(select auth\.uid\(\)\) = user_id/g),
    ).toHaveLength(3);
    expect(savedResults).toContain(
      "grant select, insert, delete on table public.saved_results to authenticated",
    );
    expect(savedResults).toContain(
      "revoke all on table public.saved_results from anon",
    );

    expect(savedLimits).toContain("saved_results_payload_size_check");
    expect(savedLimits).toContain("jsonb_typeof(trail_summary) = 'object'");
    expect(savedLimits).toContain("jsonb_typeof(trip_inputs) = 'object'");
    expect(savedLimits).toContain("jsonb_typeof(recommendation) = 'object'");
    expect(savedLimits).toContain("<= 64000");
    expect(savedLimits).toContain("security invoker");
    expect(savedLimits).toContain("set search_path = ''");
    expect(savedLimits).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(savedLimits).toMatch(/count\(\*\)[\s\S]*>= 100/);
    expect(savedLimits).toContain("constraint = 'saved_results_user_quota'");
  });

  it("keeps AI quota claims authenticated, serialized, idempotent, and exact at one hour", () => {
    expect(aiQuota).toContain(
      "check (pg_catalog.cardinality(claimed_generation_ids) <= 5)",
    );
    expect(aiQuota).toContain("security definer");
    expect(aiQuota).toContain("set search_path = ''");
    expect(aiQuota).toContain("pg_catalog.pg_advisory_xact_lock");
    expect(aiQuota).toContain(
      "current_window_started_at + interval '1 hour' <= claim_timestamp",
    );
    expect(aiQuota).toContain(
      "current_generation_id = any(current_generation_ids)",
    );
    expect(aiQuota).toContain("if current_review_count >= 5 then");
    expect(aiQuota).toContain(
      "revoke execute on function public.claim_ai_review_quota(uuid) from public, anon",
    );
    expect(aiQuota).toContain(
      "grant execute on function public.claim_ai_review_quota(uuid) to authenticated",
    );
  });
});
