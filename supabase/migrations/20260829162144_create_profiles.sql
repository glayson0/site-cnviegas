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
