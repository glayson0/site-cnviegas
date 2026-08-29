begin;
select plan(13);

select has_view('public', 'public_profiles', 'public_profiles view exists');

-- Exact column set: only the community-visible fields, nothing more.
select columns_are(
  'public', 'public_profiles',
  array['id', 'name', 'avatar', 'role', 'joined_at', 'bio', 'interests'],
  'public_profiles exposes exactly id, name, avatar, role, joined_at, bio, interests'
);

select hasnt_column('public', 'public_profiles', 'phone', 'view does not expose phone');
select hasnt_column('public', 'public_profiles', 'email', 'view does not expose email');
select hasnt_column('public', 'public_profiles', 'max_loans_allowed', 'view does not expose max_loans_allowed');

select is(
  has_table_privilege('anon', 'public.public_profiles', 'select'),
  false,
  'anonymous users cannot read the view'
);

select is(
  has_table_privilege('authenticated', 'public.public_profiles', 'select'),
  true,
  'authenticated users can read the view'
);

-- Fixtures: a reader and an admin, so the "shows everyone" behaviour can be
-- distinguished from the base table's own-row-only RLS policy.
create function pg_temp.make_user(p_id uuid, p_email text, p_name text)
returns void language plpgsql as $$
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin
  ) values (
    p_id, '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', p_email,
    extensions.crypt('demo123456', extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_name), false
  );
end; $$;

select pg_temp.make_user('b0000000-0000-0000-0000-000000000001', 'pp-reader@test.org', 'PP Reader');
select pg_temp.make_user('b0000000-0000-0000-0000-000000000002', 'pp-other@test.org', 'PP Other');

-- Act as the reader: the base table's RLS would only show their own row,
-- but the view is security_invoker = off, so it must show the whole
-- community regardless.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';

select cmp_ok(
  (select count(*)::int from public.public_profiles),
  '>=',
  2,
  'view shows every member, not just the caller''s own row'
);

select is(
  (select count(*)::int from public.public_profiles
     where id = 'b0000000-0000-0000-0000-000000000002'),
  1,
  'reader can see another member through the view'
);
reset role;

-- Root-cause verification: a brand new table created after this migration
-- must NOT inherit TRUNCATE/TRIGGER for anon or authenticated.
create table public.zz_default_priv_probe (id int);

select is(
  has_table_privilege('anon', 'public.zz_default_priv_probe', 'truncate'),
  false,
  'anon does not inherit TRUNCATE on new public tables (default privileges fixed)'
);

select is(
  has_table_privilege('authenticated', 'public.zz_default_priv_probe', 'truncate'),
  false,
  'authenticated does not inherit TRUNCATE on new public tables (default privileges fixed)'
);

select is(
  has_table_privilege('anon', 'public.zz_default_priv_probe', 'trigger'),
  false,
  'anon does not inherit TRIGGER on new public tables (default privileges fixed)'
);

select is(
  has_table_privilege('authenticated', 'public.zz_default_priv_probe', 'trigger'),
  false,
  'authenticated does not inherit TRIGGER on new public tables (default privileges fixed)'
);

select * from finish();
rollback;
