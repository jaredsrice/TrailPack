-- Saved plans require only SELECT, INSERT, and DELETE under owner RLS.
-- Remove unused privileges retained in the hosted table grants.
revoke truncate, references, trigger on table public.saved_results from authenticated;
