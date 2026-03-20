-- Pixecute Database Schema
-- Run this in your Supabase SQL editor

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Artworks table (metadata)
create table if not exists public.artworks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  key_identifier text not null,
  name text not null default 'Untitled',
  width int not null,
  height int not null,
  frame_count int not null default 1,
  layer_count int not null default 1,
  thumbnail_url text,
  storage_path text, -- path in Supabase Storage
  file_size bigint default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,

  unique(user_id, key_identifier)
);

-- Enable RLS
alter table public.artworks enable row level security;

-- Artworks policies
create policy "Users can view their own artworks"
  on public.artworks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own artworks"
  on public.artworks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own artworks"
  on public.artworks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own artworks"
  on public.artworks for delete
  using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger artworks_updated_at
  before update on public.artworks
  for each row execute procedure public.update_updated_at();

-- Create storage buckets (run in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('artworks', 'artworks', false);
-- insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', true);

-- Storage policies for artworks bucket
-- create policy "Users can upload their own artwork files"
--   on storage.objects for insert
--   with check (bucket_id = 'artworks' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can read their own artwork files"
--   on storage.objects for select
--   using (bucket_id = 'artworks' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can update their own artwork files"
--   on storage.objects for update
--   using (bucket_id = 'artworks' and auth.uid()::text = (storage.foldername(name))[1]);

-- create policy "Users can delete their own artwork files"
--   on storage.objects for delete
--   using (bucket_id = 'artworks' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for thumbnails bucket (public read)
-- create policy "Anyone can view thumbnails"
--   on storage.objects for select
--   using (bucket_id = 'thumbnails');

-- create policy "Users can upload their own thumbnails"
--   on storage.objects for insert
--   with check (bucket_id = 'thumbnails' and auth.uid()::text = (storage.foldername(name))[1]);
