begin;

create table public.plan_invitations (
  plan_id uuid not null references public.quests(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  primary key (plan_id, recipient_id)
);

create index plan_invitations_recipient on public.plan_invitations (recipient_id);
alter table public.plan_invitations enable row level security;
revoke all on public.plan_invitations from public, anon, authenticated;

create function public.invite_to_plan(p_plan uuid, recipient uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null or recipient is null or recipient = viewer
    or not exists (select 1 from public.quests q where q.id = p_plan and q.creator_id = viewer) then
    raise exception 'Only the plan creator can invite a friend.';
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

  insert into public.plan_invitations (plan_id, recipient_id)
  values (p_plan, recipient)
  on conflict do nothing;
  return found;
end;
$$;

create function public.my_plan_invitations()
returns table (
  plan_id uuid, recipient_id uuid, title text, itinerary text, person_name text,
  status text, incoming boolean
)
language sql stable security definer set search_path = '' as $$
  with viewer as (select auth.uid() as id)
  select i.plan_id, i.recipient_id, q.title, q.plan,
    coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Member'),
    i.status, i.recipient_id = v.id
  from public.plan_invitations i
  join public.quests q on q.id = i.plan_id
  cross join viewer v
  join public.profiles p on p.id = case when i.recipient_id = v.id then q.creator_id else i.recipient_id end
  where v.id in (q.creator_id, i.recipient_id)
  order by i.created_at desc, i.plan_id, i.recipient_id;
$$;

create function public.respond_to_plan_invitation(p_plan uuid, response text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or response is null or response not in ('accepted', 'declined') then
    raise exception 'Invalid invitation response.';
  end if;

  update public.plan_invitations
  set status = response
  where plan_id = p_plan and recipient_id = auth.uid() and status = 'pending';
  return found;
end;
$$;

revoke all on function public.invite_to_plan(uuid, uuid), public.my_plan_invitations(),
  public.respond_to_plan_invitation(uuid, text) from public, anon, authenticated;
grant execute on function public.invite_to_plan(uuid, uuid), public.my_plan_invitations(),
  public.respond_to_plan_invitation(uuid, text) to authenticated;

commit;
