-- B-04: keep the public authenticated table surface bounded even when a user
-- calls Supabase directly instead of going through the Next.js route.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_results_payload_size_check'
      and conrelid = 'public.saved_results'::regclass
  ) then
    alter table public.saved_results
      add constraint saved_results_payload_size_check
      check (
        jsonb_typeof(trail_summary) = 'object'
        and jsonb_typeof(trip_inputs) = 'object'
        and jsonb_typeof(recommendation) = 'object'
        and cardinality(source_labels) <= 20
        and octet_length(trail_summary::text)
          + octet_length(trip_inputs::text)
          + octet_length(recommendation::text)
          + octet_length(source_labels::text) <= 64000
      ) not valid;
  end if;
end $$;

alter table public.saved_results
  validate constraint saved_results_payload_size_check;

create or replace function public.enforce_saved_results_user_quota()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- RLS will reject a mismatched owner. Avoid doing quota work or taking a
  -- lock for any identifier other than the caller's authenticated identity.
  if new.user_id is distinct from (select auth.uid()) then
    return new;
  end if;

  -- Serialize inserts for one user so concurrent requests cannot race past the
  -- quota. The lock is released automatically with the transaction.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  if (
    select count(*)
    from public.saved_results
    where user_id = new.user_id
  ) >= 100 then
    raise exception using
      errcode = '23514',
      constraint = 'saved_results_user_quota',
      message = 'saved result quota exceeded';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_saved_results_user_quota
  on public.saved_results;

create trigger enforce_saved_results_user_quota
  before insert on public.saved_results
  for each row execute function public.enforce_saved_results_user_quota();
