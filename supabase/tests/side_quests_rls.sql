-- Run after all migrations in the Supabase SQL Editor. All fixtures roll back.
begin;
insert into auth.users(id) values ('00000000-0000-4000-8000-000000000001'), ('00000000-0000-4000-8000-000000000002');
update public.profiles set first_name='Test', last_name='Student' where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002');
insert into public.generation_requests(id,user_id,system_prompt,prompt) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','test system','test prompt');
insert into public.quests(id,creator_id,title,caption,plan,neighborhood,mood,model) values ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001','Test','Test caption','Test plan','Central Park','Cozy','test');
set local role anon;
do $$ begin
  if not exists(select 1 from public.quest_feed() where id='00000000-0000-4000-8000-000000000003') then raise exception 'Public feed failed'; end if;
  begin
    insert into public.quest_votes(quest_id,user_id,value) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002',1);
    raise exception 'Anonymous vote was allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ declare n integer; begin
  if exists(select 1 from public.profiles where id='00000000-0000-4000-8000-000000000001') then raise exception 'Profile leaked'; end if;
  if exists(select 1 from public.generation_requests where user_id='00000000-0000-4000-8000-000000000001') then raise exception 'Prompt leaked'; end if;
  update public.profiles set first_name='Stolen' where id='00000000-0000-4000-8000-000000000001';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'Cross-account update allowed'; end if;
  begin
    insert into public.quest_votes(quest_id,user_id,value) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001',1);
    raise exception 'Forged vote allowed';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.quest_votes(quest_id,user_id,value) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002',1);
do $$ begin
  begin
    insert into public.quest_votes(quest_id,user_id,value) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000002',-1);
    raise exception 'Duplicate vote allowed';
  exception when unique_violation then null; end;
  -- Generating more than five times is permitted.
  for i in 1..6 loop perform public.reserve_generation('test','test'); end loop;
end $$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.quest_votes where user_id='00000000-0000-4000-8000-000000000002') then raise exception 'Vote history leaked'; end if;
  insert into public.quest_votes(quest_id,user_id,value) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001',1);
  if not exists (select 1 from public.quest_votes where user_id='00000000-0000-4000-8000-000000000001' and quest_id='00000000-0000-4000-8000-000000000003') then raise exception 'Self-vote not saved'; end if;
  begin
    insert into public.quest_votes(quest_id,user_id,value) values('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000001',-1);
    raise exception 'Duplicate self-vote allowed';
  exception when unique_violation then null; end;
end $$;
reset role;
rollback;
