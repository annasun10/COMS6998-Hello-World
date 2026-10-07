begin;
-- Lock down every existing public table; explicitly restore only app access below.
do $$ declare t record; p record; begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
    execute format('revoke all on table public.%I from public, anon, authenticated', t.tablename);
  end loop;
  for p in select tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('games','profiles') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
grant select on public.games to anon, authenticated;
create policy "Public game library" on public.games for select to anon, authenticated using (true);
grant select on public.profiles to authenticated;
grant update (first_name, last_name, avatar_path) on public.profiles to authenticated;
create policy "Read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create table public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  system_prompt text not null check (length(system_prompt) between 1 and 5000),
  prompt text not null check (length(prompt) between 1 and 2000),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index on public.generation_requests (user_id, created_at);
create table public.quests (
  id uuid primary key,
  creator_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 100),
  caption text not null check (length(caption) between 1 and 280),
  plan text not null check (length(plan) between 1 and 1200),
  neighborhood text not null check (neighborhood in ('Morningside Heights','Upper West Side','Central Park','Lower Manhattan','Brooklyn')),
  mood text not null check (mood in ('Cozy','Social','Curious','Main character')),
  model text not null,
  created_at timestamptz not null default now(),
  foreign key (id, creator_id) references public.generation_requests(id, user_id) on delete cascade
);
create index on public.quests (created_at desc);
create table public.quest_votes (
  quest_id uuid not null references public.quests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  value smallint not null check (value in (-1,1)),
  created_at timestamptz not null default now(),
  primary key (quest_id, user_id)
);
alter table public.generation_requests enable row level security;
alter table public.quests enable row level security;
alter table public.quest_votes enable row level security;
revoke all on public.generation_requests, public.quests, public.quest_votes from public, anon, authenticated;
grant select on public.generation_requests to authenticated;
grant select on public.quests to anon, authenticated;
grant select on public.quest_votes to authenticated;
grant insert (quest_id,user_id,value) on public.quest_votes to authenticated;
grant all on public.generation_requests, public.quests, public.quest_votes to service_role;
create policy "Private generation prompts" on public.generation_requests for select to authenticated using ((select auth.uid()) = user_id);
create policy "Public AI quests" on public.quests for select to anon, authenticated using (true);
create policy "Private vote history" on public.quest_votes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own vote once" on public.quest_votes for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (select 1 from public.quests q where q.id = quest_id and q.creator_id <> (select auth.uid()))
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and length(trim(p.first_name)) > 0 and length(trim(p.last_name)) > 0)
);
-- Atomic per-account quota. Failures count as attempts to bound API usage.
create function public.reserve_generation(p_system text, p_prompt text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); request_id uuid;
begin
  if uid is null then raise exception 'Sign in to generate.'; end if;
  if not exists (select 1 from public.profiles where id = uid and length(trim(first_name)) > 0 and length(trim(last_name)) > 0) then raise exception 'Complete your profile first.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if (select count(*) from public.generation_requests where user_id = uid and created_at > now() - interval '24 hours') >= 5 then
    raise exception 'You have used your five attempts for the past 24 hours. Come back later.';
  end if;
  insert into public.generation_requests(user_id,system_prompt,prompt) values(uid,p_system,p_prompt) returning id into request_id;
  return request_id;
end $$;
revoke all on function public.reserve_generation(text,text) from public, anon;
grant execute on function public.reserve_generation(text,text) to authenticated;
-- Aggregate only: never expose other users' voting identities.
create function public.quest_feed() returns table (
  id uuid, creator_id uuid, title text, caption text, plan text, neighborhood text, mood text,
  created_at timestamptz, upvotes bigint, downvotes bigint
) language sql stable security definer set search_path = '' as $$
  select q.id,q.creator_id,q.title,q.caption,q.plan,q.neighborhood,q.mood,q.created_at,
    count(v.value) filter (where v.value = 1),count(v.value) filter (where v.value = -1)
  from (select * from public.quests order by created_at desc limit 60) q
  left join public.quest_votes v on v.quest_id = q.id
  group by q.id,q.creator_id,q.title,q.caption,q.plan,q.neighborhood,q.mood,q.created_at
  order by q.created_at desc;
$$;
revoke all on function public.quest_feed() from public;
grant execute on function public.quest_feed() to anon, authenticated;
commit;
