begin;

alter table public.plan_invitations
  add column sender_id uuid references public.profiles(id) on delete cascade;

update public.plan_invitations i
set sender_id = q.creator_id
from public.quests q
where q.id = i.plan_id;

alter table public.plan_invitations
  alter column sender_id set not null,
  drop constraint plan_invitations_pkey,
  add primary key (plan_id, sender_id, recipient_id),
  add check (sender_id <> recipient_id);

create index plan_invitations_sender on public.plan_invitations (sender_id);

drop function public.my_plan_invitations();
drop function public.respond_to_plan_invitation(uuid, text);

create or replace function public.invite_to_plan(p_plan uuid, recipient uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null or recipient is null or recipient = viewer
    or not exists (select 1 from public.quests q where q.id = p_plan) then
    raise exception 'Invalid plan invitation.';
  end if;

  perform 1 from public.friend_requests f
  where f.accepted and (
    (f.sender_id = viewer and f.recipient_id = recipient)
    or (f.recipient_id = viewer and f.sender_id = recipient)
  )
  for share;

  if not found then
    raise exception 'You can only invite friends.';
  end if;

  insert into public.plan_invitations (plan_id, sender_id, recipient_id)
  values (p_plan, viewer, recipient)
  on conflict do nothing;
  return found;
end;
$$;

create function public.my_plan_invitations()
returns table (
  plan_id uuid, sender_id uuid, recipient_id uuid, title text, itinerary text, person_name text,
  status text, incoming boolean
)
language sql stable security definer set search_path = '' as $$
  with viewer as (select auth.uid() as id)
  select i.plan_id, i.sender_id, i.recipient_id, q.title, q.plan,
    coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Member'),
    i.status, i.recipient_id = v.id
  from public.plan_invitations i
  join public.quests q on q.id = i.plan_id
  cross join viewer v
  join public.profiles p on p.id = case when i.recipient_id = v.id then i.sender_id else i.recipient_id end
  where v.id in (i.sender_id, i.recipient_id)
  order by i.created_at desc, i.plan_id, i.sender_id, i.recipient_id;
$$;

create function public.respond_to_plan_invitation(p_plan uuid, p_sender uuid, response text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or response is null or response not in ('accepted', 'declined') then
    raise exception 'Invalid invitation response.';
  end if;

  update public.plan_invitations
  set status = response
  where plan_id = p_plan and sender_id = p_sender
    and recipient_id = auth.uid() and status = 'pending';
  return found;
end;
$$;

revoke all on function public.invite_to_plan(uuid, uuid), public.my_plan_invitations(),
  public.respond_to_plan_invitation(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.invite_to_plan(uuid, uuid), public.my_plan_invitations(),
  public.respond_to_plan_invitation(uuid, uuid, text) to authenticated;

commit;
