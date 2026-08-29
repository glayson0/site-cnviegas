begin;
select plan(6);

-- Fixtures: one reader, one admin, one bystander.
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

select pg_temp.make_user('a0000000-0000-0000-0000-000000000001', 'reader@test.org', 'Reader');
select pg_temp.make_user('a0000000-0000-0000-0000-000000000002', 'admin@test.org', 'Admin');
select pg_temp.make_user('a0000000-0000-0000-0000-000000000003', 'other@test.org', 'Other');

update public.profiles set role = 'admin'
  where id = 'a0000000-0000-0000-0000-000000000002';

-- Act as the reader.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}';

select is(
  (select count(*)::int from public.profiles),
  1,
  'reader sees only their own profile row'
);

-- The column privilege must make this update fail outright.
select throws_ok(
  $q$ update public.profiles set role = 'admin'
        where id = 'a0000000-0000-0000-0000-000000000001' $q$,
  '42501',
  null,
  'reader cannot update their own role column'
);

-- Updating a permitted column on their own row must work.
select lives_ok(
  $q$ update public.profiles set bio = 'nova bio'
        where id = 'a0000000-0000-0000-0000-000000000001' $q$,
  'reader can update their own bio'
);

-- RLS must hide other users' rows, so this updates nothing.
update public.profiles set bio = 'invadido'
  where id = 'a0000000-0000-0000-0000-000000000003';
reset role;
select is(
  (select bio from public.profiles where id = 'a0000000-0000-0000-0000-000000000003'),
  null,
  'reader cannot update another user profile'
);

-- Act as the admin.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select is(
  (select count(*)::int from public.profiles),
  3,
  'admin sees every profile row'
);
reset role;

-- Anonymous users must see nothing at all in the base table.
set local role anon;
-- '{}' not '': auth.uid() casts this to jsonb, and ''::jsonb throws.
set local "request.jwt.claims" to '{}';
select is(
  (select count(*)::int from public.profiles),
  0,
  'anonymous users cannot read profiles'
);
reset role;

select * from finish();
rollback;
