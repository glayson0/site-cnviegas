-- Root-cause fix: this project's inherited default ACL grants anon and
-- authenticated TRUNCATE, REFERENCES, TRIGGER, and MAINTAIN ("Dxtm") on
-- every new table AND view created by role postgres in the public schema --
-- confirmed empirically to apply to views too, not just tables. Left
-- unfixed, every future object silently reinherits it: TRUNCATE bypasses
-- RLS entirely, and TRIGGER lets any authenticated or anon session attach a
-- trigger that rewrites protected data. This statement only changes what
-- future `create table`/`create view` statements inherit; it does not
-- touch privileges already granted on existing objects (those were already
-- stripped explicitly in the profiles_rls migration).
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

-- security_invoker = off: the view must show every member to the community
-- readers list, which the base table's own-row-only policy would otherwise
-- hide. This is intentional -- the view runs as its owner (postgres) and
-- deliberately bypasses profiles' row-level security so the whole
-- membership is visible, while still never exposing email or phone because
-- those columns simply aren't selected here.
create view public.public_profiles
with (security_invoker = off) as
  select id, name, avatar, role, joined_at, bio, interests
  from public.profiles;

-- Defence in depth: even with the default-privileges fix above, explicitly
-- strip whatever this view would otherwise have inherited before granting
-- back exactly what's needed. Final state: authenticated has SELECT only,
-- anon has nothing.
revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;
