begin;
select plan(7);

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

-- The allowlist guard must be self-contained: a NULL new_role must be
-- rejected by the FUNCTION itself with 22023, not fall through to the
-- profiles.role NOT NULL column constraint (23502). Mutation testing showed
-- the whole allowlist branch can be deleted and the original 4 tests still
-- pass, so this pins the specific errcode the function itself must raise.
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
select throws_ok(
  $q$ select public.set_user_role(
        'b0000000-0000-0000-0000-000000000001'::uuid, null) $q$,
  '22023',
  null,
  'NULL new_role is rejected by the function itself, not the NOT NULL column constraint'
);

-- General coverage for the invalid-role branch, so the allowlist check
-- itself cannot be silently deleted without a test failing.
select throws_ok(
  $q$ select public.set_user_role(
        'b0000000-0000-0000-0000-000000000001'::uuid, 'superadmin') $q$,
  '22023',
  null,
  'a role outside reader/admin is rejected'
);
reset role;

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

-- Binding guard: `for update` in the demotion branch above is the fix for
-- a real vulnerability -- without it, two concurrent demotions can each
-- read the same pre-demotion admin_count under READ COMMITTED (a
-- concurrent, uncommitted UPDATE is invisible to a plain SELECT), both
-- conclude "not the last admin", and both commit, leaving the collective
-- with zero admins and no in-app recovery path (promoting a new admin
-- itself requires an existing admin). Mutation testing proved the lock can
-- be deleted with the whole suite above still green, because tests 1-6 run
-- on a single connection and can only observe the *symptom* a second,
-- concurrent connection would trigger -- not the race itself. Pin the
-- lock's literal presence in the function body so silently deleting it is
-- no longer free.
-- Anchored to the actual code shape (the admin_count subquery), not just
-- the substring "for update" -- the function's own explanatory comments
-- above mention "for update" in prose several times, so a bare substring
-- match would still pass even with the real clause deleted.
select matches(
  pg_get_functiondef('public.set_user_role(uuid, text)'::regprocedure),
  $pat$profiles where role = 'admin' for update\) t$pat$,
  'set_user_role retains the FOR UPDATE row lock guarding against concurrent double-demotion to zero admins'
);

select * from finish();
rollback;
