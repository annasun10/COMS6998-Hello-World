begin;

create function public.withdraw_plan_invitation(p_plan uuid, p_recipient uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.plan_invitations
  where plan_id = p_plan
    and sender_id = (select auth.uid())
    and recipient_id = p_recipient;
$$;

revoke all on function public.withdraw_plan_invitation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.withdraw_plan_invitation(uuid, uuid) to authenticated;

commit;
