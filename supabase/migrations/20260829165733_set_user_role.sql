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

  if new_role not in ('reader', 'admin') then
    raise exception 'invalid role: %', new_role using errcode = '22023';
  end if;

  if new_role = 'reader' then
    select count(*) into admin_count from public.profiles where role = 'admin';
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
