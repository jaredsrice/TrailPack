-- The initially applied Production function used current_time as a PL/pgSQL
-- variable name. PostgreSQL resolved that token as the time-with-time-zone
-- expression inside SQL statements, so the first timestamptz insert failed.
-- The base migration is corrected for new installs; this follow-up remains
-- necessary for deployments that already recorded the original migration.

create or replace function public.claim_ai_review_quota()
returns table (
  allowed boolean,
  remaining smallint,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_window_started_at timestamptz;
  current_review_count smallint;
  claim_timestamp timestamptz := now();
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text, 29)
  );

  select quota.window_started_at, quota.review_count
  into current_window_started_at, current_review_count
  from public.ai_review_quotas as quota
  where quota.user_id = current_user_id;

  if not found then
    insert into public.ai_review_quotas (
      user_id,
      window_started_at,
      review_count
    ) values (
      current_user_id,
      claim_timestamp,
      1
    );

    return query select
      true,
      4::smallint,
      claim_timestamp + interval '1 hour';
    return;
  end if;

  if current_window_started_at + interval '1 hour' <= claim_timestamp then
    update public.ai_review_quotas
    set window_started_at = claim_timestamp,
        review_count = 1
    where user_id = current_user_id;

    return query select
      true,
      4::smallint,
      claim_timestamp + interval '1 hour';
    return;
  end if;

  if current_review_count >= 5 then
    return query select
      false,
      0::smallint,
      current_window_started_at + interval '1 hour';
    return;
  end if;

  update public.ai_review_quotas
  set review_count = review_count + 1
  where user_id = current_user_id;

  return query select
    true,
    (4 - current_review_count)::smallint,
    current_window_started_at + interval '1 hour';
end;
$$;

revoke execute on function public.claim_ai_review_quota() from public, anon;
grant execute on function public.claim_ai_review_quota() to authenticated;
