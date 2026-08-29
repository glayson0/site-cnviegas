begin;
select plan(4);

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

select pg_temp.make_user('b0000000-0000-0000-0000-000000000001', 'reader@test.org', 'Reader');
select pg_temp.make_user('b0000000-0000-0000-0000-000000000002', 'admin@test.org', 'Admin');

update public.profiles set role = 'admin'
  where id = 'b0000000-0000-0000-0000-000000000002';

-- A non-admin must be refused.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
select throws_ok(
  $q$ select public.set_user_role(
        'b0000000-0000-0000-0000-000000000001'::uuid, 'admin') $q$,
  '42501',
  null,
  'non-admin cannot call set_user_role'
);

-- An admin may promote a reader.
set local "request.jwt.claims" to '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select lives_ok(
  $q$ select public.set_user_role(
        'b0000000-0000-0000-0000-000000000001'::uuid, 'admin') $q$,
  'admin can promote a reader'
);
reset role;
select is(
  (select role from public.profiles where id = 'b0000000-0000-0000-0000-000000000001'),
  'admin',
  'promotion persisted'
);

-- Demote back down to one admin, then prove the last one is protected.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select public.set_user_role('b0000000-0000-0000-0000-000000000001'::uuid, 'reader');
select throws_ok(
  $q$ select public.set_user_role(
        'b0000000-0000-0000-0000-000000000002'::uuid, 'reader') $q$,
  'P0001',
  'cannot demote the last admin',
  'the last admin cannot be demoted'
);
reset role;

select * from finish();
rollback;
