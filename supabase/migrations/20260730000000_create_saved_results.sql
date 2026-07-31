-- B-03: a result belongs to exactly one authenticated Supabase user.
-- This migration intentionally has no custom user profile or password table:
-- Google identity remains provider-managed by Supabase Auth.
create table public.saved_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  trail_summary jsonb not null,
  trip_inputs jsonb not null,
  recommendation jsonb not null,
  source_labels text[] not null default '{}'
);

comment on table public.saved_results is
  'Private TrailPack packing-list snapshots owned by one authenticated user.';
comment on column public.saved_results.trip_inputs is
  'Only bounded recommendation-relevant inputs. Free-form notes are excluded.';

create index saved_results_user_created_at_idx
  on public.saved_results (user_id, created_at desc);

alter table public.saved_results enable row level security;

revoke all on table public.saved_results from anon;
grant select, insert, delete on table public.saved_results to authenticated;

create policy "Users can view their own saved results"
  on public.saved_results for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can save their own results"
  on public.saved_results for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved results"
  on public.saved_results for delete to authenticated
  using ((select auth.uid()) = user_id);
