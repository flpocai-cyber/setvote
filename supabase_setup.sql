-- SETVOTE SUPABASE SCHEMA (IDEMPOTENT VERSION)

-- 1. Create a table for songs
create table if not exists public.songs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  artist text not null,
  lyrics text,
  sheet_music_url text,
  cover_image_url text,
  is_active boolean default true,
  votes integer default 0,
  played boolean default false,
  play_order integer,
  tone text,
  bpm integer,
  category text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create a table for votes
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  song_id uuid references public.songs(id) on delete cascade,
  session_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create a table for musician profiles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  musician_name text default 'Meu Setlist',
  profile_image_url text,
  welcome_text text default 'Olá! Vote na sua música favorita para eu tocar!',
  voting_active boolean default true,
  last_reset_at timestamp with time zone default timezone('utc'::text, now()) not null,
  current_show_id text default gen_random_uuid()::text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Function to increment votes
create or replace function increment_vote(song_id uuid)
returns void as $$
begin
  update public.songs
  set votes = votes + 1
  where id = song_id;
end;
$$ language plpgsql security definer;

-- 5. Enable Row Level Security (RLS)
alter table public.songs enable row level security;
alter table public.votes enable row level security;
alter table public.profiles enable row level security;

-- 6. Policies for Public access
drop policy if exists "Public songs are viewable by everyone." on public.songs;
create policy "Public songs are viewable by everyone." on public.songs
  for select using (true);

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Anyone can insert votes." on public.votes;
create policy "Anyone can insert votes." on public.votes
  for insert with check (true);

-- 7. Policies for Admin access
drop policy if exists "Admins can do everything on songs" on public.songs;
create policy "Admins can do everything on songs" on public.songs
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Admins can do everything on votes" on public.votes;
create policy "Admins can do everything on votes" on public.votes
  for all to authenticated
  using (true)
  with check (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles
  for all to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 8. Realtime (Safe attempt to add replication)
do $$
begin
  if not exists (select from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'songs') then
    alter publication supabase_realtime add table public.songs;
  end if;
  if not exists (select from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
    alter publication supabase_realtime add table public.profiles;
  end if;
exception when others then
end $$;

-- 9. Storage Policies
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('sheets', 'sheets', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('profiles', 'profiles', true) on conflict (id) do nothing;

drop policy if exists "Admin Upload Covers" on storage.objects;
create policy "Admin Upload Covers" on storage.objects for insert with check (bucket_id = 'covers' and auth.role() = 'authenticated');
drop policy if exists "Admin Upload Sheets" on storage.objects;
create policy "Admin Upload Sheets" on storage.objects for insert with check (bucket_id = 'sheets' and auth.role() = 'authenticated');
drop policy if exists "Admin Upload Profiles" on storage.objects;
create policy "Admin Upload Profiles" on storage.objects for insert with check (bucket_id = 'profiles' and auth.role() = 'authenticated');
drop policy if exists "Public Select Objects" on storage.objects;
create policy "Public Select Objects" on storage.objects for select using (bucket_id in ('covers', 'sheets', 'profiles'));

-- 10. Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, musician_name)
  values (new.id, 'Meu Setlist');
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 11. Sponsors table
create table if not exists public.sponsors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text not null,
  website_url text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 12. PIX fields on profiles
alter table public.profiles
  add column if not exists pix_key text,
  add column if not exists pix_name text;

-- 13. RLS for sponsors
alter table public.sponsors enable row level security;

drop policy if exists "Public sponsors are viewable by everyone." on public.sponsors;
create policy "Public sponsors are viewable by everyone." on public.sponsors
  for select using (true);

drop policy if exists "Admins can manage sponsors" on public.sponsors;
create policy "Admins can manage sponsors" on public.sponsors
  for all to authenticated using (true) with check (true);

-- 14. Realtime for sponsors
do $$
begin
  if not exists (select from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sponsors') then
    alter publication supabase_realtime add table public.sponsors;
  end if;
exception when others then
end $$;

-- 15. Storage bucket for sponsor logos
insert into storage.buckets (id, name, public) values ('sponsors', 'sponsors', true) on conflict (id) do nothing;

drop policy if exists "Admin Upload Sponsors" on storage.objects;
create policy "Admin Upload Sponsors" on storage.objects for insert with check (bucket_id = 'sponsors' and auth.role() = 'authenticated');
drop policy if exists "Public Select Sponsors" on storage.objects;
create policy "Public Select Sponsors" on storage.objects for select using (bucket_id = 'sponsors');

