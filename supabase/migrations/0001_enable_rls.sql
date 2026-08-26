-- Security baseline for Swimlog.
-- Review against the live schema before applying if table or column names differ.

create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

grant execute on function public.current_user_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.training_log enable row level security;
alter table public.resting_hr_log enable row level security;
alter table public.body_metrics_log enable row level security;
alter table public.technique_plans enable row level security;
alter table public.goals_yearly enable row level security;

drop policy if exists "profiles read own or coach" on public.profiles;
create policy "profiles read own or coach"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.current_user_role() = 'coach');

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role::text is not distinct from public.current_user_role()
);

drop policy if exists "training read own or coach" on public.training_log;
create policy "training read own or coach"
on public.training_log
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'coach');

drop policy if exists "training insert own" on public.training_log;
create policy "training insert own"
on public.training_log
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "training update own" on public.training_log;
create policy "training update own"
on public.training_log
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "rhr read own or coach" on public.resting_hr_log;
create policy "rhr read own or coach"
on public.resting_hr_log
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'coach');

drop policy if exists "rhr insert own" on public.resting_hr_log;
create policy "rhr insert own"
on public.resting_hr_log
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "rhr update own" on public.resting_hr_log;
create policy "rhr update own"
on public.resting_hr_log
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "body read own or coach" on public.body_metrics_log;
create policy "body read own or coach"
on public.body_metrics_log
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'coach');

drop policy if exists "body insert own" on public.body_metrics_log;
create policy "body insert own"
on public.body_metrics_log
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "body update own" on public.body_metrics_log;
create policy "body update own"
on public.body_metrics_log
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "plans read own or coach" on public.technique_plans;
create policy "plans read own or coach"
on public.technique_plans
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'coach');

drop policy if exists "plans insert coach" on public.technique_plans;
create policy "plans insert coach"
on public.technique_plans
for insert
to authenticated
with check (public.current_user_role() = 'coach');

drop policy if exists "plans update coach" on public.technique_plans;
create policy "plans update coach"
on public.technique_plans
for update
to authenticated
using (public.current_user_role() = 'coach')
with check (public.current_user_role() = 'coach');

drop policy if exists "goals read own or coach" on public.goals_yearly;
create policy "goals read own or coach"
on public.goals_yearly
for select
to authenticated
using (user_id = auth.uid() or public.current_user_role() = 'coach');

drop policy if exists "goals insert own" on public.goals_yearly;
create policy "goals insert own"
on public.goals_yearly
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "goals update own" on public.goals_yearly;
create policy "goals update own"
on public.goals_yearly
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
