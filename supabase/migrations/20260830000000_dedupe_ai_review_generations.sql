-- Treat one explicit packing-list generation as one quota claim. A stable
-- generation UUID lets retries fail closed without charging or contacting the
-- provider twice. The optional argument keeps the previous deployed route
-- working during rollout; legacy no-argument calls receive a unique UUID and
-- retain the existing five-per-hour behavior.

alter table public.ai_review_quotas
add column if not exists claimed_generation_ids uuid[] not null
default array[]::uuid[];

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'ai_review_quotas_generation_count_check'
      and conrelid = 'public.ai_review_quotas'::regclass
  ) then
    alter table public.ai_review_quotas
    add constraint ai_review_quotas_generation_count_check
      check (pg_catalog.cardinality(claimed_generation_ids) <= 5);
  end if;
end $$;

drop function if exists public.claim_ai_review_quota();

create function public.claim_ai_review_quota(
  review_generation_id uuid default null
)
returns table (
  allowed boolean,
  duplicate boolean,
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
  current_generation_ids uuid[];
  current_generation_id uuid := coalesce(
    review_generation_id,
    pg_catalog.gen_random_uuid()
  );
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

  select
    quota.window_started_at,
    quota.review_count,
    quota.claimed_generation_ids
  into
    current_window_started_at,
    current_review_count,
    current_generation_ids
  from public.ai_review_quotas as quota
  where quota.user_id = current_user_id;

  if not found then
    insert into public.ai_review_quotas (
      user_id,
      window_started_at,
      review_count,
      claimed_generation_ids
    ) values (
      current_user_id,
      claim_timestamp,
      1,
      array[current_generation_id]
    );

    return query select
      true,
      false,
      4::smallint,
      claim_timestamp + interval '1 hour';
    return;
  end if;

  if current_window_started_at + interval '1 hour' <= claim_timestamp then
    update public.ai_review_quotas
    set window_started_at = claim_timestamp,
        review_count = 1,
        claimed_generation_ids = array[current_generation_id]
    where user_id = current_user_id;

    return query select
      true,
      false,
      4::smallint,
      claim_timestamp + interval '1 hour';
    return;
  end if;

  if current_generation_id = any(current_generation_ids) then
    return query select
      false,
      true,
      greatest(0, 5 - current_review_count)::smallint,
      current_window_started_at + interval '1 hour';
    return;
  end if;

  if current_review_count >= 5 then
    return query select
      false,
      false,
      0::smallint,
      current_window_started_at + interval '1 hour';
    return;
  end if;

  update public.ai_review_quotas
  set review_count = review_count + 1,
      claimed_generation_ids = pg_catalog.array_append(
        claimed_generation_ids,
        current_generation_id
      )
  where user_id = current_user_id;

  return query select
    true,
    false,
    (4 - current_review_count)::smallint,
    current_window_started_at + interval '1 hour';
end;
$$;

comment on function public.claim_ai_review_quota(uuid) is
  'Atomically claims one guarded-AI allowance per authenticated packing-list generation.';

revoke execute on function public.claim_ai_review_quota(uuid) from public, anon;
grant execute on function public.claim_ai_review_quota(uuid) to authenticated;
