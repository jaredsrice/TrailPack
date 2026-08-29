-- Production guarded-AI quota: one authenticated user may generate at most
-- five live reviews during an hour-long window anchored to their first review.

create table public.ai_review_quotas (
  user_id uuid primary key references auth.users (id) on delete cascade,
  window_started_at timestamptz not null default now(),
  review_count smallint not null default 0,
  constraint ai_review_quotas_count_check
    check (review_count between 0 and 5)
);

comment on table public.ai_review_quotas is
  'Server-enforced per-user counters for TrailPack live AI reviews.';

alter table public.ai_review_quotas enable row level security;

revoke all on table public.ai_review_quotas from anon, authenticated;

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
  current_time timestamptz := now();
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication required';
  end if;

  -- Keep the check and increment atomic for one user across serverless workers.
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
      current_time,
      1
    );

    return query select
      true,
      4::smallint,
      current_time + interval '1 hour';
    return;
  end if;

  if current_window_started_at + interval '1 hour' <= current_time then
    update public.ai_review_quotas
    set window_started_at = current_time,
        review_count = 1
    where user_id = current_user_id;

    return query select
      true,
      4::smallint,
      current_time + interval '1 hour';
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
