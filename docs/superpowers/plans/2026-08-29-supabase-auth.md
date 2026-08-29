# Supabase Auth Integration (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fake `localStorage` auth with real Supabase Auth, backed by a `profiles` table whose role column cannot be written by its owner.

**Architecture:** Approach C (hybrid). `app/layout.tsx` is a Server Component that resolves the session with `getUser()` and seeds a thin client `AuthProvider`, which subscribes to `onAuthStateChange` to stay live. `proxy.ts` gates routes as a convenience; RLS in Postgres is the actual security boundary.

**Tech Stack:** Next.js 16.3.1 (App Router), React 19.2.8, TypeScript 5, `@supabase/ssr` 0.12.x, `@supabase/supabase-js` 2.112.x, Supabase CLI 2.109.1, Postgres 17 + pgTAP, Tailwind 4.

**Spec:** `docs/superpowers/specs/2026-08-29-supabase-auth-design.md`

## Global Constraints

- **RLS is the boundary; the proxy redirect is convenience.** Write every policy as though the Next.js app does not exist.
- **Server-side session reads use `getUser()`, never `getSession()`.** Only `getUser()` revalidates the JWT.
- **Imports are relative** (`../context/AuthContext`), matching existing code. The `@/*` alias exists in `tsconfig.json` but is unused — do not introduce it.
- **All UI copy is Brazilian Portuguese**, matching existing pages.
- **Roles stored in the database are only `reader` and `admin`.** `visitor` is a client-side derived state meaning "no session" and is never persisted.
- **Every SQL function is `set search_path = ''`** and fully qualifies object names.
- **Demo password is `demo123456`** for all four seeded accounts.
- Do not create, link, or push to a hosted Supabase project. Local stack only.
- Commit after every task.

---

### Task 1: Local Supabase scaffold and environment

**Files:**
- Create: `supabase/config.toml` (via CLI)
- Create: `.env.local.example`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: a running local stack; `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` available for later tasks.

- [ ] **Step 1: Initialize the Supabase project**

```bash
supabase init
```

Expected: creates `supabase/config.toml` and `supabase/.gitignore`.

- [ ] **Step 2: Disable email confirmation**

In `supabase/config.toml`, find the `[auth.email]` section and set:

```toml
[auth.email]
enable_signup = true
enable_confirmations = false
```

Rationale: no SMTP is configured, so confirmation emails would never send and signups would strand.

- [ ] **Step 3: Start the stack**

```bash
supabase start
```

Expected: prints `API URL`, `anon key`, `service_role key`. This takes a few minutes on first run while images download.

- [ ] **Step 4: Write the env example**

Create `.env.local.example`:

```bash
# Local development (values printed by `supabase start`)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from `supabase status`>
```

- [ ] **Step 5: Create the real env file and confirm it is ignored**

```bash
supabase status -o env > /dev/null   # sanity check the stack is up
cp .env.local.example .env.local
# paste the real anon key from `supabase status` into .env.local
git check-ignore .env.local && echo "correctly ignored"
```

Expected: prints `correctly ignored`. The existing `.gitignore` already has `.env*`; if `git check-ignore` prints nothing, add `.env*` to `.gitignore`.

- [ ] **Step 6: Commit**

```bash
git add supabase/config.toml supabase/.gitignore .env.local.example .gitignore
git commit -m "chore: scaffold local Supabase stack with confirmations disabled"
```

---

### Task 2: profiles table and signup trigger

**Files:**
- Create: `supabase/migrations/<timestamp>_create_profiles.sql`
- Create: `supabase/tests/profiles_trigger.test.sql`

**Interfaces:**
- Consumes: Task 1's local stack
- Produces: `public.profiles` with columns `id uuid, name text, email text, role text, avatar text, phone text, bio text, interests text[], joined_at timestamptz, max_loans_allowed int`; trigger `on_auth_user_created`.

- [ ] **Step 1: Create the migration file**

```bash
supabase migration new create_profiles
```

- [ ] **Step 2: Write the failing test**

Create `supabase/tests/profiles_trigger.test.sql`:

```sql
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
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
supabase test db --local supabase/tests/profiles_trigger.test.sql
```

Expected: FAIL — `relation "public.profiles" does not exist`.

- [ ] **Step 4: Write the migration**

In the generated `supabase/migrations/<timestamp>_create_profiles.sql`:

```sql
create table public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text not null,
  email             text not null,
  role              text not null default 'reader' check (role in ('reader','admin')),
  avatar            text,
  phone             text,
  bio               text,
  interests         text[] not null default '{}',
  joined_at         timestamptz not null default now(),
  max_loans_allowed int not null default 3
);

alter table public.profiles enable row level security;

-- Profiles are created by this trigger, never by clients, so a profile
-- can never be missing and registration stays a single signUp() call.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email, phone, bio, interests)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'bio',
    coalesce(
      (select array_agg(v)
         from jsonb_array_elements_text(
           coalesce(new.raw_user_meta_data->'interests', '[]'::jsonb)
         ) as v),
      '{}'::text[]
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 5: Apply and run the test**

```bash
supabase db reset
supabase test db --local supabase/tests/profiles_trigger.test.sql
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests
git commit -m "feat(db): add profiles table and signup trigger"
```

---

### Task 3: RLS policies and role column privilege

**Files:**
- Create: `supabase/migrations/<timestamp>_profiles_rls.sql`
- Create: `supabase/tests/profiles_rls.test.sql`

**Interfaces:**
- Consumes: `public.profiles` from Task 2
- Produces: `public.is_admin() returns boolean`; policies `profiles_select_own_or_admin`, `profiles_update_own_or_admin`; column-level update grant limited to `name, avatar, phone, bio, interests`.

- [ ] **Step 1: Create the migration file**

```bash
supabase migration new profiles_rls
```

- [ ] **Step 2: Write the failing test**

Create `supabase/tests/profiles_rls.test.sql`:

```sql
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
set local "request.jwt.claims" to '';
select is(
  (select count(*)::int from public.profiles),
  0,
  'anonymous users cannot read profiles'
);
reset role;

select * from finish();
rollback;
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
supabase test db --local supabase/tests/profiles_rls.test.sql
```

Expected: FAIL — with RLS enabled and no policies, the reader sees 0 rows, not 1.

- [ ] **Step 4: Write the migration**

```sql
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

-- RLS cannot compare against the old row value, so column privileges are
-- what actually stop a user rewriting their own role. This binds admins too;
-- role changes go exclusively through public.set_user_role (Task 5).
revoke update on public.profiles from authenticated;
grant update (name, avatar, phone, bio, interests)
  on public.profiles to authenticated;
```

- [ ] **Step 5: Apply and run the test**

```bash
supabase db reset
supabase test db --local supabase/tests/profiles_rls.test.sql
```

Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests
git commit -m "feat(db): add profiles RLS policies and role column privilege"
```

---

### Task 4: public_profiles view

**Files:**
- Create: `supabase/migrations/<timestamp>_public_profiles_view.sql`
- Create: `supabase/tests/public_profiles.test.sql`

**Interfaces:**
- Consumes: `public.profiles` from Task 2
- Produces: view `public.public_profiles` with columns `id, name, avatar, role, joined_at, bio, interests`, selectable by `authenticated` only.

- [ ] **Step 1: Create the migration file**

```bash
supabase migration new public_profiles_view
```

- [ ] **Step 2: Write the failing test**

Create `supabase/tests/public_profiles.test.sql`:

```sql
begin;
select plan(4);

select has_view('public', 'public_profiles', 'public_profiles view exists');
select hasnt_column('public', 'public_profiles', 'phone', 'view does not expose phone');
select hasnt_column('public', 'public_profiles', 'email', 'view does not expose email');

select is(
  has_table_privilege('anon', 'public.public_profiles', 'select'),
  false,
  'anonymous users cannot read the view'
);

select * from finish();
rollback;
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
supabase test db --local supabase/tests/public_profiles.test.sql
```

Expected: FAIL — view does not exist.

- [ ] **Step 4: Write the migration**

```sql
-- security_invoker = off: the view must show every member to the community
-- readers list, which the base table's own-row-only policy would otherwise hide.
create view public.public_profiles
with (security_invoker = off) as
  select id, name, avatar, role, joined_at, bio, interests
  from public.profiles;

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to authenticated;
```

- [ ] **Step 5: Apply and run the test**

```bash
supabase db reset
supabase test db --local supabase/tests/public_profiles.test.sql
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations supabase/tests
git commit -m "feat(db): add public_profiles view without contact columns"
```

---

### Task 5: set_user_role RPC with last-admin guard

**Files:**
- Create: `supabase/migrations/<timestamp>_set_user_role.sql`
- Create: `supabase/tests/set_user_role.test.sql`

**Interfaces:**
- Consumes: `public.is_admin()` from Task 3
- Produces: `public.set_user_role(target_id uuid, new_role text) returns void`, executable by `authenticated`.

- [ ] **Step 1: Create the migration file**

```bash
supabase migration new set_user_role
```

- [ ] **Step 2: Write the failing test**

Create `supabase/tests/set_user_role.test.sql`:

```sql
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
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
supabase test db --local supabase/tests/set_user_role.test.sql
```

Expected: FAIL — `function public.set_user_role(uuid, text) does not exist`.

- [ ] **Step 4: Write the migration**

```sql
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
```

- [ ] **Step 5: Apply and run the test**

```bash
supabase db reset
supabase test db --local supabase/tests/set_user_role.test.sql
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Run the whole suite and commit**

```bash
supabase test db --local supabase/tests
git add supabase/migrations supabase/tests
git commit -m "feat(db): add set_user_role RPC with last-admin guard"
```

Expected: all four test files pass.

---

### Task 6: Seed the demo accounts

**Files:**
- Create: `supabase/seed.sql`

**Interfaces:**
- Consumes: the trigger from Task 2
- Produces: four real auth accounts — `admin@cnviegas.org` (admin), `leitor@cnviegas.org`, `beatriz@cnviegas.org`, `lucas@cnviegas.org` (readers), all with password `demo123456`.

- [ ] **Step 1: Write the seed file**

Create `supabase/seed.sql`. Names, emails and bios mirror `INITIAL_USERS` in `data/initial-data.ts`:

```sql
-- Demo fixtures. The password is public by design; these accounts must
-- never hold real data. The admin here is the first-admin bootstrap, since
-- in-app promotion cannot promote the very first admin.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin
)
select
  u.id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', u.email,
  extensions.crypt('demo123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', u.name),
  false
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
```

- [ ] **Step 2: Apply and verify**

```bash
supabase db reset
supabase db query "select email, role from public.profiles order by email"
```

Expected: four rows; `admin@cnviegas.org` has role `admin`, the other three `reader`.

- [ ] **Step 3: Verify the seeded admin can actually log in**

```bash
curl -s -X POST "http://127.0.0.1:54321/auth/v1/token?grant_type=password" \
  -H "apikey: $(supabase status -o json | grep -o '"ANON_KEY":"[^"]*"' | cut -d'"' -f4)" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cnviegas.org","password":"demo123456"}' | head -c 200
```

Expected: a JSON body containing `access_token`. If it returns `invalid_credentials`, the `encrypted_password` hash did not take.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.sql
git commit -m "feat(db): seed demo accounts with the coordinator as first admin"
```

---
### Task 7: Profile mapper, AuthContext rewrite, and server-seeded layout

**Files:**
- Create: `lib/profile.ts`
- Modify: `types/library.ts` (add `interests` to `User`)
- Rewrite: `context/AuthContext.tsx`
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `public.profiles` (Task 2), `lib/supabase/client.ts` and `lib/supabase/server.ts` (already in the repo)
- Produces:
  - `profileToUser(row: ProfileRow): User`
  - `fetchProfile(supabase: SupabaseClient, userId: string): Promise<User | null>`
  - `AuthProvider({ children, initialUser })`
  - `useAuth(): { currentUser, role, isAuthenticated, login, loginAsDemo, logout, register }`
  - `AuthResult = { ok: boolean; error?: string }`

These three files change together because the provider cannot compile without the mapper and the layout cannot compile without the provider's new prop.

- [ ] **Step 1: Add `interests` to the User type**

In `types/library.ts`, add one field to the `User` interface, after `bio`:

```ts
  interests?: string[];
```

- [ ] **Step 2: Create the profile mapper**

Create `lib/profile.ts`. This is shared because both the Server Component layout and the client provider need the same snake_case-to-camelCase mapping:

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { User, UserRole } from '../types/library';

const PROFILE_COLUMNS =
  'id, name, email, role, avatar, phone, bio, interests, joined_at, max_loans_allowed';

export interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: Exclude<UserRole, 'visitor'>;
  avatar: string | null;
  phone: string | null;
  bio: string | null;
  interests: string[] | null;
  joined_at: string;
  max_loans_allowed: number;
}

export function profileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    avatar: row.avatar ?? undefined,
    phone: row.phone ?? undefined,
    bio: row.bio ?? undefined,
    interests: row.interests ?? [],
    joinedAt: row.joined_at.slice(0, 10),
    maxLoansAllowed: row.max_loans_allowed,
  };
}

export async function fetchProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return profileToUser(data as ProfileRow);
}
```

- [ ] **Step 3: Rewrite AuthContext**

Replace the entire contents of `context/AuthContext.tsx`:

```tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, UserRole } from '../types/library';
import { createClient } from '../lib/supabase/client';
import { fetchProfile } from '../lib/profile';

export interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextType {
  currentUser: User | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  loginAsDemo: (role: 'reader' | 'admin') => Promise<AuthResult>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
    bio?: string,
    interests?: string[],
  ) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Seeded fixtures from supabase/seed.sql. The password is public by design.
const DEMO_CREDENTIALS = {
  admin: { email: 'admin@cnviegas.org', password: 'demo123456' },
  reader: { email: 'leitor@cnviegas.org', password: 'demo123456' },
};

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter ao menos 6 caracteres.';
  }
  if (message.toLowerCase().includes('rate limit')) {
    return 'Muitas tentativas. Tente novamente em alguns minutos.';
  }
  return 'Não foi possível completar a ação. Tente novamente.';
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser: User | null;
}) {
  // Seeded by the server layout, so there is no logged-out flash on load.
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setCurrentUser(null);
        return;
      }
      setCurrentUser(await fetchProfile(supabase, session.user.id));
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    router.refresh();
    return { ok: true };
  };

  const loginAsDemo = (demoRole: 'reader' | 'admin'): Promise<AuthResult> => {
    const { email, password } = DEMO_CREDENTIALS[demoRole];
    return login(email, password);
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.refresh();
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    bio?: string,
    interests: string[] = [],
  ): Promise<AuthResult> => {
    const { error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name: name.trim(),
          phone: phone?.trim() ?? '',
          bio: bio?.trim() ?? '',
          interests,
        },
      },
    });
    if (error) return { ok: false, error: translateAuthError(error.message) };
    router.refresh();
    return { ok: true };
  };

  const role: UserRole = currentUser ? currentUser.role : 'visitor';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated: !!currentUser,
        login,
        loginAsDemo,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

Note there is no `switchRole` — it had no consumers and cannot exist under real auth.

- [ ] **Step 4: Make the layout resolve the session**

In `app/layout.tsx`, add two imports:

```tsx
import { createClient } from '../lib/supabase/server';
import { fetchProfile } from '../lib/profile';
```

Change the component to `async` and resolve the user, then pass it down:

```tsx
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const initialUser = user ? await fetchProfile(supabase, user.id) : null;
```

and change the provider element from `<AuthProvider>` to:

```tsx
        <AuthProvider initialUser={initialUser}>
```

Use `getUser()`, never `getSession()` — only `getUser()` revalidates the JWT.

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: two errors, both in `app/(auth)/login/page.tsx` and `app/(auth)/register/page.tsx`, because those still call the old synchronous signatures. Tasks 8 and 9 fix them. If any *other* file errors, a consumer was missed — fix it before continuing.

- [ ] **Step 6: Commit**

```bash
git add lib/profile.ts context/AuthContext.tsx app/layout.tsx types/library.ts
git commit -m "feat(auth): back AuthContext with Supabase and seed it server-side"
```

---

### Task 8: Login page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

**Interfaces:**
- Consumes: `useAuth().login`, `useAuth().loginAsDemo` from Task 7

The page already has email and password fields and a `loading` state, so this is a wiring change, not a redesign.

- [ ] **Step 1: Make the submit handler async**

Find the submit handler that calls `login(email, password)`. Replace its body so it awaits the result and surfaces the error. Add an error state alongside the existing `loading` state:

```tsx
  const [error, setError] = useState<string | null>(null);
```

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível entrar.');
      return;
    }
    router.push('/');
  };
```

If the file does not already import `useRouter`, add `import { useRouter } from 'next/navigation';` and `const router = useRouter();`.

- [ ] **Step 2: Make the demo buttons async**

Replace the demo handler so it awaits and reports failure:

```tsx
  const handleDemo = async (demoRole: 'reader' | 'admin') => {
    setError(null);
    setLoading(true);
    const result = await loginAsDemo(demoRole);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível entrar com a conta demo.');
      return;
    }
    router.push('/');
  };
```

- [ ] **Step 3: Render the error**

Above the submit button, add:

```tsx
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
```

- [ ] **Step 4: Typecheck**

```bash
npx tsc --noEmit
```

Expected: the login page no longer errors; `app/(auth)/register/page.tsx` still does.

- [ ] **Step 5: Verify by hand**

```bash
npm run dev
```

Visit `http://localhost:3000/login`. Check all three: the reader demo button logs in, the admin demo button logs in, and a wrong password shows "E-mail ou senha incorretos." rather than silently succeeding — the old code accepted anything, so this is the behavior that proves auth is real.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)/login/page.tsx"
git commit -m "feat(auth): wire login page to Supabase with real error states"
```

---

### Task 9: Registration page

**Files:**
- Modify: `app/(auth)/register/page.tsx`

**Interfaces:**
- Consumes: `useAuth().register` from Task 7

This page has no password field today, and it collects `selectedInterests` that are currently discarded.

- [ ] **Step 1: Add password state**

Alongside the existing `useState` declarations:

```tsx
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
```

- [ ] **Step 2: Add the password field**

After the email field's wrapper block, matching the markup and Tailwind classes of the surrounding inputs:

```tsx
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="password">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-black px-4 py-3 text-base outline-none focus:border-red-600"
                />
              </div>
```

Copy the `className` from the adjacent email input if it differs from the above — match the file, not this plan.

- [ ] **Step 3: Make the submit handler async and pass interests through**

```tsx
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await register(name, email, password, phone, bio, selectedInterests);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível concluir o cadastro.');
      return;
    }
    router.push('/');
  };
```

Add `useRouter` if not already imported.

- [ ] **Step 4: Render the error**

```tsx
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
```

- [ ] **Step 5: Typecheck**

```bash
npx tsc --noEmit
```

Expected: exit 0, no errors anywhere.

- [ ] **Step 6: Verify registration persists interests**

Register a new account through the UI at `/register`, picking at least two interests, then:

```bash
supabase db query "select email, name, interests, role from public.profiles where email = '<the email you used>'"
```

Expected: one row, `role` = `reader`, `interests` containing exactly what you selected. This proves the trigger, the metadata plumbing, and the new field all line up.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/register/page.tsx"
git commit -m "feat(auth): add password field and persist interests on registration"
```

---

### Task 10: Navbar logout

**Files:**
- Modify: `components/Navbar.tsx:26` and its logout handler

**Interfaces:**
- Consumes: `useAuth().logout` from Task 7

- [ ] **Step 1: Await the logout call**

`logout` is now async. Find the click handler calling `logout()` and make it await, then send the user home:

```tsx
  const handleLogout = async () => {
    await logout();
    router.push('/');
  };
```

Add `import { useRouter } from 'next/navigation';` and `const router = useRouter();` if absent, and point the button's `onClick` at `handleLogout`.

- [ ] **Step 2: Typecheck and build**

```bash
npx tsc --noEmit && npm run build
```

Expected: both exit 0.

- [ ] **Step 3: Verify by hand**

With the dev server running, log in, then log out. The navbar must return to its logged-out state without a manual page reload — that is what proves the `onAuthStateChange` subscription is wired.

- [ ] **Step 4: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat(auth): await Supabase sign-out in the navbar"
```

---

### Task 11: Route protection in the proxy

**Files:**
- Modify: `proxy.ts`

**Interfaces:**
- Consumes: `public.profiles.role`

Remember this gate is convenience, not security — RLS is the boundary. Its job is to stop a reader loading an admin page that would render empty.

- [ ] **Step 1: Add the gate**

In `proxy.ts`, replace the `await supabase.auth.getUser()` line with a captured result, then add the route logic before `return supabaseResponse`:

```ts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsSession = path.startsWith('/admin') || path.startsWith('/readers');

  // Redirect responses must carry the refreshed auth cookies, or the session
  // is lost on the very next request.
  const redirectTo = (pathname: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      response.cookies.set(name, value);
    });
    return response;
  };

  if (!user && needsSession) {
    return redirectTo('/login');
  }

  if (user && path.startsWith('/admin')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return redirectTo('/');
    }
  }
```

- [ ] **Step 2: Build**

```bash
npx tsc --noEmit && npm run build
```

Expected: both exit 0.

- [ ] **Step 3: Verify all four cases by hand**

With the dev server running:

1. Logged out, visit `/admin` → redirected to `/login`
2. Logged out, visit `/readers` → redirected to `/login`
3. Logged in via the **reader** demo button, visit `/admin` → redirected to `/`
4. Logged in via the **admin** demo button, visit `/admin` → the page renders

Then confirm the session survives a redirect: after case 3, reload `/` and check you are still logged in. If you are logged out, the cookie copying in `redirectTo` is wrong.

- [ ] **Step 4: Commit**

```bash
git add proxy.ts
git commit -m "feat(auth): gate admin and reader routes in the proxy"
```

---

### Task 12: Documentation and full verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything above

- [ ] **Step 1: Document local setup**

Add to `README.md`, after the existing "Variáveis de ambiente" section:

````markdown
## Banco de dados local

O projeto usa Supabase. Para rodar o stack local:

```bash
supabase start          # sobe Postgres, Auth e API em Docker
supabase status         # mostra a URL e a anon key para o .env.local
supabase db reset       # aplica migrations e o seed
```

### Contas de demonstração

Criadas por `supabase/seed.sql`, todas com a senha `demo123456`:

| E-mail | Papel |
| --- | --- |
| `admin@cnviegas.org` | admin |
| `leitor@cnviegas.org` | leitor |
| `beatriz@cnviegas.org` | leitor |
| `lucas@cnviegas.org` | leitor |

São fixtures públicas — nunca devem conter dados reais.

### Testes de banco

```bash
supabase test db --local supabase/tests
```

### Papéis

Novos cadastros recebem `reader`. Apenas admins promovem outros usuários, via a
função `set_user_role`. Ninguém pode alterar o próprio papel: a coluna `role` é
revogada para `authenticated`. O último admin não pode ser rebaixado.
````

- [ ] **Step 2: Run the complete verification**

```bash
supabase db reset
supabase test db --local supabase/tests
npx tsc --noEmit
npm run build
```

Expected: all four succeed. Record the pgTAP totals — 18 assertions across 4 files.

- [ ] **Step 3: Confirm nothing reads localStorage for auth**

```bash
grep -rn "cnviegas_library_auth_user" --include=*.tsx --include=*.ts . | grep -v node_modules
```

Expected: no output. Any hit means a code path still trusts the old fake session.

- [ ] **Step 4: Commit and push**

```bash
git add README.md
git commit -m "docs: document local Supabase setup, demo accounts, and roles"
git push -u origin feat/supabase-auth
```

- [ ] **Step 5: Open the PR**

```bash
gh pr create --base develop --head feat/supabase-auth \
  --title "feat(auth): replace localStorage auth with Supabase Auth" \
  --body "Implements docs/superpowers/specs/2026-08-29-supabase-auth-design.md (phase 1 of 2).

Phase 2 — migrating LibraryContext (books, loans, reviews) to Postgres — is deliberately not in this branch. The app is intentionally half-migrated: identity is real, library data is still in localStorage.

Known gap: pgTAP covers the RLS and role-integrity boundary; nothing automated covers the React layer, because the repo has no test runner. Adding Vitest is a reasonable follow-up."
```

---

## Notes for the executor

- **If a pgTAP test passes on the first run, stop and check why.** Every test in Tasks 2–5 must fail before its migration is written. A test that passes immediately is testing nothing.
- **`supabase db reset` destroys local data and re-runs every migration plus the seed.** That is expected and safe here; it never touches a hosted project.
- **Do not add `switchRole` back.** If a component appears to need it, that component is trying to grant itself a role, which is the vulnerability this branch removes.
- **`max_loans_allowed` is intentionally unenforced** in this phase. `borrowBook` still checks only `availableCopies`. Enforcement belongs to phase 2.
