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

-- This project's default privileges grant anon/authenticated TRUNCATE,
-- REFERENCES, TRIGGER, and MAINTAIN on every public-schema table created by
-- role postgres ("Dxtm" -- the capital D is TRUNCATE, not DELETE). Left in
-- place, this is a full bypass of everything above: TRUNCATE empties the
-- table without ever consulting RLS, and TRIGGER lets any authenticated or
-- anon session attach its own trigger (even one defined in pg_temp) that
-- rewrites protected columns -- including role -- on every UPDATE, since
-- column-level privileges are checked only against the columns named in the
-- client's SET list, never against what a later trigger assigns. Strip every
-- inherited default privilege before granting back exactly what's needed.
revoke all on public.profiles from anon, authenticated;

-- Base SELECT is required for the policies above to be reachable at all:
-- the table-level grant is checked before RLS is ever consulted, so without
-- it every select fails with "permission denied for table profiles"
-- regardless of policy. Scoped to authenticated only: granting it to anon
-- too would be unnecessary blast radius the moment a future policy omits an
-- explicit `to` clause (which defaults to PUBLIC, exposing anon through it).
-- With no grant at all, RLS still does its job for anon -- the table-level
-- check now simply denies anon a step earlier, which is a stronger "cannot
-- read profiles" than an empty result set.
grant select on public.profiles to authenticated;

-- service_role is never reachable from the browser, but Supabase's
-- server-side tooling (service-role API calls, pg_meta, Studio) expects it
-- to be able to read every table; it isn't covered by the inherited default
-- privileges either.
grant select on public.profiles to service_role;

-- RLS cannot compare against the old row value, so column privileges are
-- what actually stop a user rewriting their own role. This binds admins too;
-- role changes go exclusively through public.set_user_role (Task 5).
grant update (name, avatar, phone, bio, interests)
  on public.profiles to authenticated;
