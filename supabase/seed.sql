-- Demo fixtures. The password is public by design; these accounts must
-- never hold real data. The admin here is the first-admin bootstrap, since
-- in-app promotion cannot promote the very first admin.
--
-- The four token/email-change columns below (confirmation_token,
-- recovery_token, email_change_token_new, email_change) are nullable with
-- no default in auth.users. Left unset they insert as NULL, and GoTrue's
-- Go driver scans them into a plain string -- "converting NULL to string
-- is unsupported" -- turning every password grant into a 500. Setting
-- them to '' explicitly is what makes the seeded accounts able to log in.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
)
select
  u.id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', u.email,
  extensions.crypt('demo123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', u.name),
  false,
  '', '', '', ''
from (values
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'admin@cnviegas.org',   'Coordenação da Biblioteca'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'leitor@cnviegas.org',  'Leitor Comunitário'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'beatriz@cnviegas.org', 'Beatriz Nascimento'),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'lucas@cnviegas.org',   'Lucas Andrade')
) as u(id, email, name);

-- The trigger created these as readers; promote the coordinator.
update public.profiles
  set role = 'admin', avatar = '🛡️', max_loans_allowed = 10
  where id = 'd0000000-0000-0000-0000-000000000001';
