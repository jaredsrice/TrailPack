-- Shared guest-search budget. Twenty initial requests, then one every six
-- seconds: at most 620 claims in any hour, leaving NPS capacity for alerts.
-- Only one row exists; no user IDs, IP addresses, or search text is retained.
create table public.nps_lookup_quota (
  singleton boolean primary key default true check (singleton),
  tokens numeric not null check (tokens >= 0 and tokens <= 20),
  updated_at timestamptz not null
);
alter table public.nps_lookup_quota enable row level security;
revoke all on public.nps_lookup_quota from public, anon, authenticated;
insert into public.nps_lookup_quota values (true, 20, pg_catalog.clock_timestamp());

create function public.claim_nps_lookup_quota()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  available numeric;
  previous_at timestamptz;
  claimed_at timestamptz;
begin
  select q.tokens, q.updated_at into available, previous_at
  from public.nps_lookup_quota as q where q.singleton = true for update;
  if not found then return false; end if;
  -- Take the clock after acquiring the row lock, including concurrent workers.
  claimed_at := pg_catalog.clock_timestamp();
  available := least(20, available +
    greatest(0, extract(epoch from claimed_at - previous_at)) / 6);
  update public.nps_lookup_quota
  set tokens = case when available >= 1 then available - 1 else available end,
      updated_at = claimed_at
  where singleton = true;
  return available >= 1;
end;
$$;
revoke execute on function public.claim_nps_lookup_quota() from public;
grant execute on function public.claim_nps_lookup_quota() to anon, authenticated;
comment on function public.claim_nps_lookup_quota() is
  'Consumes one fixed, shared NPS search allowance. Public callers can only consume, not replenish or inspect the bucket.';
