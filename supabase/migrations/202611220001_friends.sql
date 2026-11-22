begin;

create table public.friend_requests (
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  accepted boolean not null default false,
  primary key (sender_id, recipient_id),
  check (sender_id <> recipient_id)
);

create unique index friend_requests_one_per_pair on public.friend_requests
  (least(sender_id, recipient_id), greatest(sender_id, recipient_id));
create index friend_requests_recipient on public.friend_requests (recipient_id);

alter table public.friend_requests enable row level security;
revoke all on public.friend_requests from public, anon, authenticated;

create function public.friend_people(search_name text)
returns table (id uuid, name text, relationship text)
language sql stable security definer set search_path = '' as $$
  with viewer as (select auth.uid() as id),
  connections as (
    select case when r.sender_id = v.id then r.recipient_id else r.sender_id end as id,
      case when r.accepted then 'friend'
        when r.sender_id = v.id then 'sent' else 'received' end as relationship
    from public.friend_requests r
    cross join viewer v
    where v.id in (r.sender_id, r.recipient_id)
  ),
  people as (
    select p.id, concat_ws(' ', p.first_name, p.last_name) as name
    from public.profiles p
    cross join viewer v
    where p.id <> v.id
      and length(trim(coalesce(p.first_name, ''))) > 0
      and length(trim(coalesce(p.last_name, ''))) > 0
      and length(trim(search_name)) between 2 and 100
      and strpos(lower(concat_ws(' ', p.first_name, p.last_name)), lower(trim(search_name))) > 0
    order by name, p.id
    limit 25
  )
  select c.id, coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Member'),
    c.relationship
  from connections c join public.profiles p on p.id = c.id
  union all
  select p.id, p.name, 'available'
  from people p
  where not exists (select 1 from connections c where c.id = p.id)
  order by 2, 1;
$$;

create function public.change_friendship(person_id uuid, operation text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  viewer uuid := auth.uid();
begin
  if viewer is null or person_id is null or viewer = person_id then
    raise exception 'Invalid friend request.';
  end if;

  case operation
    when 'send' then
      if not exists (
        select 1 from public.profiles where id = person_id
          and length(trim(first_name)) > 0 and length(trim(last_name)) > 0
      ) or not exists (
        select 1 from public.profiles where id = viewer
          and length(trim(first_name)) > 0 and length(trim(last_name)) > 0
      ) then
        raise exception 'Both profiles must be complete.';
      end if;

      insert into public.friend_requests (sender_id, recipient_id)
      values (viewer, person_id)
      on conflict do nothing;
    when 'accept' then
      update public.friend_requests set accepted = true
      where sender_id = person_id and recipient_id = viewer and not accepted;
    when 'decline' then
      delete from public.friend_requests
      where sender_id = person_id and recipient_id = viewer and not accepted;
    when 'cancel' then
      delete from public.friend_requests
      where sender_id = viewer and recipient_id = person_id and not accepted;
    when 'remove' then
      delete from public.friend_requests where accepted and (
        (sender_id = viewer and recipient_id = person_id)
        or (sender_id = person_id and recipient_id = viewer)
      );
    else
      raise exception 'Unknown friend request action.';
  end case;
end;
$$;

revoke all on function public.friend_people(text), public.change_friendship(uuid, text) from public, anon, authenticated;
grant execute on function public.friend_people(text), public.change_friendship(uuid, text) to authenticated;

commit;
