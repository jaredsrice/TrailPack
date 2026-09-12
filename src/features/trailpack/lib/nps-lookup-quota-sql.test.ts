import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("executes the real quota migration and enforces roles, burst, refill and singleton storage", async () => {
  const db = new PGlite();
  try {
    await db.exec("create role anon; create role authenticated;");
    await db.exec(readFileSync("supabase/migrations/20260911000000_nps_lookup_quota.sql", "utf8"));
    await db.exec("set role anon;");
    const claims = await db.query<{ allowed: boolean }>(
      "select public.claim_nps_lookup_quota() as allowed from generate_series(1,21)",
    );
    expect(claims.rows.filter((row) => row.allowed)).toHaveLength(20);
    for (const sql of [
      "select * from public.nps_lookup_quota",
      "update public.nps_lookup_quota set tokens=20",
      "delete from public.nps_lookup_quota",
    ]) {
      await expect(db.query(sql)).rejects.toMatchObject({ code: "42501" });
    }
    await db.exec("reset role; update public.nps_lookup_quota set tokens=0, updated_at=clock_timestamp()-interval '6 seconds'; set role authenticated;");
    expect((await db.query<{ allowed: boolean }>("select public.claim_nps_lookup_quota() as allowed")).rows[0].allowed).toBe(true);
    expect((await db.query<{ allowed: boolean }>("select public.claim_nps_lookup_quota() as allowed")).rows[0].allowed).toBe(false);
    await db.exec("reset role;");
    expect((await db.query("select count(*) as count from public.nps_lookup_quota")).rows[0]).toEqual({ count: 1 });
    const definition = await db.query<{ definition: string }>(
      "select pg_get_functiondef('public.claim_nps_lookup_quota()'::regprocedure) as definition",
    );
    expect(definition.rows[0].definition).toMatch(/for update/i);
  } finally { await db.close(); }
}, 15_000);
