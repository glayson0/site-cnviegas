# Supabase Auth Integration — Design

**Date:** 2026-08-29
**Branch:** `feat/supabase-auth`
**Status:** Approved for planning

## Problem

The app authenticates nothing. `AuthContext.login()` accepts any email with no
password check and grants `admin` to any address containing the substring
`"admin"`. `loginAsDemo()` and `switchRole()` mint an admin session client-side
on click. All identity lives in `localStorage` under `cnviegas_library_auth_user`.

Separately, `lib/supabase/{client,server}.ts` and `proxy.ts` already exist and
correctly refresh a Supabase session — but nothing reads it. The app has an auth
system and a session system that have never been connected.

## Scope

This is **phase 1 of 2: authentication only.**

In scope: Supabase Auth, a `profiles` table, RLS, role management, and rewiring
`AuthContext` plus the three components that call its mutating methods.

Out of scope, deferred to phase 2: migrating `LibraryContext` (books, loans,
reviews) from `localStorage` to Postgres. Those tables' RLS policies are written
in terms of `auth.uid()` and role, so authentication must be real first.

Also out of scope: React test infrastructure (no runner exists in this repo;
adding one is a separate decision), and any hosted Supabase project.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Sequencing | Auth first, data second | Data RLS depends on real identity; keeps PRs reviewable |
| Admin creation | Admins promote others in-app | Chosen over dashboard-only promotion |
| First admin | Seeded via `seed.sql` | In-app promotion cannot bootstrap itself |
| Demo login | Real seeded accounts, buttons kept | Nothing faked; RLS applies normally |
| Schema management | Migrations in repo + local Docker stack | Schema in version control and reviewable |
| Email confirmation | Auto-confirm (off) | No SMTP configured; confirmations would strand signups |
| `selectedInterests` | Persisted to `profiles.interests` | Currently collected at registration and discarded |
| Session strategy | Approach C (hybrid) | See below |

### Approach C: server seeds, client stays reactive, proxy enforces

Rejected alternatives:

- **All client-side.** Minimal churn, but every page flashes logged-out state on
  load and `/admin` is guarded only by client-side checks a user can bypass.
- **Fully server-first.** Strongest gate and most idiomatic for Next 16, but every
  page is `'use client'` today with modals, toasts and local state. Converting
  them is a large refactor that exceeds the auth swap and would collide with phase 2.

Chosen: the root layout resolves the session server-side and seeds a thin client
provider; the provider subscribes to `onAuthStateChange` to stay live; `proxy.ts`
gates routes.

### Security boundary

**RLS in Postgres is the enforcement boundary. The proxy redirect is convenience.**

Anyone can call the Supabase REST API directly with the anon key and bypass the
Next.js app entirely. Route gating exists so a reader does not load an admin page
that would render empty; it is not what keeps data safe. Policies are written as
though the UI does not exist.

Server-side code uses `getUser()`, never `getSession()`. Only `getUser()`
revalidates the JWT against the auth server; `getSession()` trusts a cookie.

## Schema

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
```

`UserRole` in TypeScript has three values, but `visitor` means "no session" and is
never stored. The check constraint permits only `reader` and `admin`.

`max_loans_allowed` is carried over from the current `User` type. It is **not
enforced anywhere today** — `borrowBook` checks only `availableCopies`. Enforcing
it belongs to phase 2; the column exists here so the profile is complete.

### Profile creation

A `handle_new_user()` trigger on `auth.users` inserts the matching `profiles` row,
reading `name`, `phone`, `bio` and `interests` from `raw_user_meta_data`. Clients
never insert profiles directly, so a profile cannot be missing and registration
stays a single `signUp()` call.

### Role integrity

Three mechanisms, in order of strength:

1. **Column privilege.** `revoke update (role) on public.profiles from authenticated;`
   No user may write `role`, whatever any policy says. RLS cannot express this
   itself, because a policy cannot compare against the old row value.
2. **Promotion RPC.** The revoke above blocks admins too, so role changes happen
   only through `public.set_user_role(target uuid, new_role text)`, a
   `SECURITY DEFINER` function that verifies the caller is an admin and refuses to
   demote the last remaining admin. The last-admin guard must be server-side; a
   client check is trivially bypassed.
3. **`public.is_admin()`**, also `SECURITY DEFINER`. Exists to avoid infinite
   recursion: a policy on `profiles` that determines admin-ness by selecting from
   `profiles` recurses. The helper bypasses RLS to break the cycle.

### Read access

`profiles` holds `phone` and `email`. Members need to see each other on `/readers`,
but that must not expose every member's phone number.

- Base table `select`: a user may read their own row; admins may read any row.
  Anonymous users may read nothing.
- Base table `update`: a user may update only their own row, and only the columns
  `name, avatar, phone, bio, interests` — `role` is excluded by the column
  privilege above, and `id`, `email`, `joined_at` and `max_loans_allowed` are not
  granted. Admins may update any row through the same column set.
- `public.public_profiles` view exposes `id, name, avatar, role, joined_at, bio,
  interests` — no `phone`, no `email` — for the community list. Readable by any
  authenticated user; not readable anonymously, since `/readers` requires a session.
- Admin screens read the base table.

### Seed data

`supabase/seed.sql` creates the four users from `data/initial-data.ts` as real
`auth.users` rows sharing a documented demo password; the trigger gives each a
profile. `admin@cnviegas.org` seeds as `admin` and is the first-admin bootstrap.

## Auth flows

`app/layout.tsx` becomes a Server Component: `createClient()` → `getUser()` → join
`profiles` → pass as `initialUser` into `AuthProvider`. Because the server has
already resolved identity, there is no initial loading state and no logged-out
flash, so the context needs no global `loading` flag. The provider subscribes to
`onAuthStateChange` so login and logout update without a reload.

### `useAuth()` surface

| Current | New |
|---|---|
| `login(email, password?) => boolean` | `login(email, password) => Promise<{ok, error?}>` |
| `register(name, email, phone?, bio?) => boolean` | `register(name, email, password, phone?, bio?, interests?) => Promise<{ok, error?}>` |
| `logout() => void` | `logout() => Promise<void>` |
| `loginAsDemo(role) => void` | `loginAsDemo(role) => Promise<{ok, error?}>` |
| `switchRole(role) => void` | **removed** (dead code; no consumers) |
| `currentUser`, `role`, `isAuthenticated` | unchanged |

`{ok, error}` replaces the bare boolean because real auth fails in ways the fake
one could not — wrong password, rate limiting — and the forms should say which.

### Route protection

`proxy.ts`, after refreshing the session: `/admin/*` requires `role = 'admin'`;
`/readers` requires a session; all other routes stay public.

## Files touched

| File | Change |
|---|---|
| `context/AuthContext.tsx` | Rewritten against `supabase.auth`; `switchRole` deleted |
| `app/layout.tsx` | Server Component; resolves user + profile, seeds provider |
| `proxy.ts` | Adds route gate |
| `app/(auth)/login/page.tsx` | Async `login`/`loginAsDemo`; real error text |
| `app/(auth)/register/page.tsx` | Add password field; async; persist `interests` |
| `components/Navbar.tsx` | `logout` becomes async |
| `types/library.ts` | `User` gains `interests`; role typing tightened |
| `supabase/` (new) | `config.toml`, migrations, `seed.sql`, pgTAP tests |

Unchanged, despite calling `useAuth()`: `components/BookCard.tsx`,
`components/BookDetailModal.tsx`, `components/LoanModal.tsx`, `app/page.tsx`,
`app/books/page.tsx`, `app/readers/page.tsx`. All six read only `currentUser`,
`role` and `isAuthenticated`, whose shapes are unchanged.

## Testing

Via `supabase test db` (pgTAP) against the local stack:

1. A reader cannot update their own `role`
2. A reader cannot update another user's profile
3. A non-admin calling `set_user_role` is rejected
4. An admin can promote a reader to admin
5. Demoting the last remaining admin fails
6. `public_profiles` exposes neither `phone` nor `email`
7. `handle_new_user` creates a profile on signup
8. An anonymous user cannot read `profiles`

UI flows — login, register, both demo buttons, logout, and `/admin` as a reader —
are verified manually against the local stack.

**Known gap:** nothing automated covers the React layer, because the repo has no
test runner. Adding Vitest + Testing Library is a reasonable follow-up branch and
is deliberately excluded here.

## Rollout

Development runs entirely against `supabase start`. The branch ships
`.env.local.example` and README setup steps. When a hosted project exists:
`supabase link`, `supabase db push`, set `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. No hosted project is touched by this work.

## Risks

- **Auto-confirm means unverified email addresses.** Anyone can register under an
  address they do not own. Acceptable for a community library; enabling
  confirmation later requires wiring an SMTP provider.
- **The demo password is public** by definition. The demo accounts are seeded
  fixtures and must never hold real data.
- **Phase 1 leaves the app half-migrated:** identity is real while books, loans and
  reviews remain in `localStorage`. This is intended and resolves in phase 2.
