begin;
select plan(4);

select has_table('public', 'profiles', 'profiles table exists');

-- A new auth user must automatically get a profile row.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
) values (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'trigger@test.org',
  extensions.crypt('demo123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Trigger Test","phone":"11999","bio":"oi","interests":["Filosofia","Poesia & Artes"]}'::jsonb,
  false
);

select is(
  (select name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Trigger Test',
  'trigger copies name from signup metadata'
);

select is(
  (select role from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'reader',
  'new profiles default to reader'
);

select is(
  (select interests from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  array['Filosofia','Poesia & Artes'],
  'trigger persists interests array'
);

select * from finish();
rollback;
