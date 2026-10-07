begin;
drop policy if exists "Insert own vote once" on public.quest_votes;
create policy "Insert own vote once" on public.quest_votes
for insert to authenticated with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and length(trim(p.first_name)) > 0
      and length(trim(p.last_name)) > 0
  )
);
-- The existing foreign key requires a real quest, and the primary key
-- (quest_id, user_id) still enforces one vote per account per idea.
commit;
