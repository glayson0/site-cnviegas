-- SECURITY DEFINER so it bypasses RLS on profiles. Without this, a policy
-- that determines admin-ness by selecting from profiles recurses infinitely.
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using ( id = (select auth.uid()) or public.is_admin() );

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using ( id = (select auth.uid()) or public.is_admin() )
  with check ( id = (select auth.uid()) or public.is_admin() );

-- This project's default privileges withhold SELECT/INSERT/UPDATE on public
-- schema tables from anon/authenticated by default (only Dxtm is granted
-- automatically). Without this base SELECT grant, the policies above are
-- unreachable: the table-level privilege check runs before RLS is ever
-- consulted, so every select would fail with "permission denied for table
-- profiles" instead of being filtered by the policies. Granting it to anon
-- too is safe: neither select policy applies "to anon", so RLS still hides
-- every row from anonymous requests.
grant select on public.profiles to authenticated, anon;

-- RLS cannot compare against the old row value, so column privileges are
-- what actually stop a user rewriting their own role. This binds admins too;
-- role changes go exclusively through public.set_user_role (Task 5).
revoke update on public.profiles from authenticated;
grant update (name, avatar, phone, bio, interests)
  on public.profiles to authenticated;
