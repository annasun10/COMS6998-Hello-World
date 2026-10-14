begin;
-- Only the value of a user's own vote may change; its identity stays fixed.
grant update (value) on public.quest_votes to authenticated;
create policy "Change own vote" on public.quest_votes
for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and length(trim(p.first_name)) > 0
      and length(trim(p.last_name)) > 0
  )
);

-- Atomically insert or replace the existing vote, retaining one vote per user.
create function public.cast_quest_vote(p_quest_id uuid, p_value smallint)
returns void language sql security invoker set search_path = '' as $$
  insert into public.quest_votes (quest_id, user_id, value)
  values (p_quest_id, auth.uid(), p_value)
  on conflict (quest_id, user_id) do update set value = excluded.value;
$$;
revoke all on function public.cast_quest_vote(uuid, smallint) from public, anon;
grant execute on function public.cast_quest_vote(uuid, smallint) to authenticated;
commit;
