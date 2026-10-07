begin;
create or replace function public.reserve_generation(p_system text, p_prompt text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); request_id uuid;
begin
  if uid is null then raise exception 'Sign in to generate.'; end if;
  if not exists (
    select 1 from public.profiles
    where id = uid and length(trim(first_name)) > 0 and length(trim(last_name)) > 0
  ) then raise exception 'Complete your profile first.'; end if;
  insert into public.generation_requests(user_id, system_prompt, prompt)
  values(uid, p_system, p_prompt) returning id into request_id;
  return request_id;
end $$;
revoke all on function public.reserve_generation(text,text) from public, anon;
grant execute on function public.reserve_generation(text,text) to authenticated;
commit;
