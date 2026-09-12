import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { expect, it } from "vitest";

it("removes unused saved-result privileges while preserving owner-scoped save and delete", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth to anon, authenticated;
      insert into auth.users values
        ('00000000-0000-4000-8000-000000000001'),
        ('00000000-0000-4000-8000-000000000002');
    `);
    const migrations = readdirSync("supabase/migrations").filter(name => name.endsWith(".sql")).sort();
    for (const name of migrations.filter(name => name < "20260911000000")) {
      await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
    }
    // Reproduce the captured hosted grants, including unused provider defaults.
    await db.exec("grant truncate, references, trigger on public.saved_results to authenticated;");
    for (const name of migrations.filter(name => name === "20260912000000_restrict_saved_results_privileges.sql")) {
      await db.exec(readFileSync(`supabase/migrations/${name}`, "utf8"));
    }

    const access = await db.query<{ role: string; privilege: string; allowed: boolean }>(`
      select role, privilege, has_table_privilege(role, 'public.saved_results', privilege) as allowed
      from unnest(array['anon', 'authenticated']) role
      cross join unnest(array['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE']) privilege
      order by role, privilege
    `);
    expect(access.rows.filter(row => row.allowed)).toEqual([
      { role: "authenticated", privilege: "DELETE", allowed: true },
      { role: "authenticated", privilege: "INSERT", allowed: true },
      { role: "authenticated", privilege: "SELECT", allowed: true },
    ]);

    await db.exec(`
      set role authenticated;
      select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);
      insert into public.saved_results (user_id, trail_summary, trip_inputs, recommendation)
      values (auth.uid(), '{}', '{}', '{}');
    `);
    expect((await db.query("select count(*)::int as count from public.saved_results")).rows).toEqual([{ count: 1 }]);
    await expect(db.exec("truncate public.saved_results")).rejects.toMatchObject({ code: "42501" });

    await db.exec("select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000002', false);");
    expect((await db.query("select count(*)::int as count from public.saved_results")).rows).toEqual([{ count: 0 }]);
    expect((await db.query("delete from public.saved_results returning id")).rows).toEqual([]);
    await expect(db.exec(`
      insert into public.saved_results (user_id, trail_summary, trip_inputs, recommendation)
      values ('00000000-0000-4000-8000-000000000001', '{}', '{}', '{}')
    `)).rejects.toMatchObject({ code: "42501" });

    await db.exec("select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000001', false);");
    expect((await db.query("delete from public.saved_results returning id")).rows).toHaveLength(1);
    expect((await db.query("select count(*)::int as count from public.saved_results")).rows).toEqual([{ count: 0 }]);
  } finally {
    await db.close();
  }
}, 15_000);
