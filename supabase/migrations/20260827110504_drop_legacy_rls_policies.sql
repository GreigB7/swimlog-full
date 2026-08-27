-- Remove legacy permissive policies that predate the security baseline.
-- These duplicate the authenticated-only policies and can weaken role/update checks.

drop policy if exists "profiles: coach read all" on public.profiles;
drop policy if exists "profiles: read self" on public.profiles;
drop policy if exists "profiles: update self" on public.profiles;

drop policy if exists "training: coach read all" on public.training_log;
drop policy if exists "training: swimmer self" on public.training_log;
drop policy if exists "training_log: coach read all" on public.training_log;
drop policy if exists "training_log: swimmer self" on public.training_log;

drop policy if exists "rhr: coach read all" on public.resting_hr_log;
drop policy if exists "rhr: swimmer self" on public.resting_hr_log;

drop policy if exists "body: coach read all" on public.body_metrics_log;
drop policy if exists "body: swimmer self" on public.body_metrics_log;

drop policy if exists "goals: coach select any" on public.goals_yearly;
drop policy if exists "goals: swimmer insert own" on public.goals_yearly;
drop policy if exists "goals: swimmer select own" on public.goals_yearly;
drop policy if exists "goals: swimmer update own" on public.goals_yearly;

drop policy if exists "technique_plans: coach write" on public.technique_plans;
drop policy if exists "technique_plans: read own or coach" on public.technique_plans;

revoke execute on function public.current_user_role() from public;
revoke execute on function public.current_user_role() from anon;
grant execute on function public.current_user_role() to authenticated;
