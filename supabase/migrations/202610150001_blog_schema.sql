create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  excerpt text not null default '',
  content_html text not null,
  category text not null default '라이프',
  cover_style text not null default 'blue',
  view_count bigint not null default 0,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.likes (
  user_id uuid references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at);
create index if not exists likes_post_id_idx on public.likes (post_id);
create index if not exists follows_following_id_idx on public.follows (following_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users manage own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "posts are public" on public.posts for select using (true);
create policy "authors create posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "authors update posts" on public.posts for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "authors delete posts" on public.posts for delete using (auth.uid() = author_id);
create policy "follows are public" on public.follows for select using (true);
create policy "users manage follows" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
create policy "likes are public" on public.likes for select using (true);
create policy "users manage likes" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "comments are public" on public.comments for select using (true);
create policy "users create comments" on public.comments for insert with check (auth.uid() = author_id);
create policy "authors update comments" on public.comments for update using (auth.uid() = author_id) with check (auth.uid() = author_id);
create policy "authors delete comments" on public.comments for delete using (auth.uid() = author_id);

create or replace function public.increment_post_views(post_uuid uuid)
returns void language sql security definer set search_path = public as $$
  update public.posts set view_count = view_count + 1 where id = post_uuid;
$$;
grant execute on function public.increment_post_views(uuid) to anon, authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  base_name text;
begin
  base_name := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'reader'
  );
  base_username := coalesce(
    nullif(new.raw_user_meta_data->>'username', ''),
    'user_' || substr(replace(new.id::text, '-', ''), 1, 8)
  );
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    base_username,
    base_name,
    coalesce(nullif(new.raw_user_meta_data->>'avatar_url', ''), nullif(new.raw_user_meta_data->>'picture', ''))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
