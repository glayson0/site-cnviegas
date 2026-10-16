-- SECURITY DEFINER: this runs as owner, which is how it bypasses the
-- column-level revoke on profiles.role. The admin check and the last-admin
-- guard must live here, server-side, because a client check is bypassable.
create function public.set_user_role(target_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_count int;
begin
  if not public.is_admin() then
    raise exception 'only admins may change roles' using errcode = '42501';
  end if;

  -- NULL-safe on purpose: `null not in (...)` evaluates to NULL (neither
  -- true nor false), so a plain `if new_role not in (...)` silently lets a
  -- NULL new_role fall through this guard. Without the explicit `is null`
  -- check here, a NULL role would only ever be caught downstream by
  -- profiles.role's NOT NULL constraint (see 20260829162144_create_profiles.sql)
  -- -- an accidental, undocumented dependency on a different migration, and
  -- one that (via PostgREST) leaks the whole failing row, including email
  -- and phone, in the constraint-violation error's `details` field. This
  -- function must reject NULL itself, cleanly, with 22023.
  if new_role is null or new_role not in ('reader', 'admin') then
    raise exception 'invalid role: %', new_role using errcode = '22023';
  end if;

  -- `is not null` here is technically redundant given the guard above (by
  -- this point new_role can only be 'reader' or 'admin'), but the branch is
  -- written defensively so it stays correct even if the guard above is ever
  -- reordered, refactored, or partially removed.
  if new_role is not null and new_role = 'reader' then
    -- `for update` is load-bearing, not decorative: without it, two
    -- concurrent callers each read the same pre-demotion admin_count under
    -- READ COMMITTED, since a concurrent UPDATE that hasn't committed yet is
    -- invisible to this SELECT and takes no lock that would conflict with a
    -- plain read. Both callers then see "not the last admin", both commit,
    -- and the collective is left with zero admins -- unrecoverable in-app,
    -- since promoting a new admin itself requires an existing admin. Locking
    -- every current admin row here forces the second caller to block until
    -- the first commits, then re-evaluate the row against a fresh, correct
    -- snapshot (Postgres re-checks a FOR UPDATE row against the query's
    -- WHERE clause once the lock is granted), so the guard can no longer be
    -- raced.
    select count(*) into admin_count
      from (select 1 from public.profiles where role = 'admin' for update) t;
    if admin_count <= 1
       and exists (select 1 from public.profiles
                   where id = target_id and role = 'admin') then
      raise exception 'cannot demote the last admin' using errcode = 'P0001';
    end if;
  end if;

  update public.profiles set role = new_role where id = target_id;
end;
$$;

revoke execute on function public.set_user_role(uuid, text) from anon, public;
grant execute on function public.set_user_role(uuid, text) to authenticated;
