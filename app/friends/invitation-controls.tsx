"use client";

import { useActionState, useState } from "react";
import IdeaSelect from "../quests/idea-select";
import Link from "next/link";
import { inviteFriend, respondToInvitation, withdrawInvitation } from "./invitation-actions";

export function InviteFriend({ planId, friends, invitedIds = [] }: { planId: string; friends: { id: string; name: string }[]; invitedIds: string[] }) {
  const [state, action, pending] = useActionState(inviteFriend, {});
  const [recipient, setRecipient] = useState("");
  const friendNames = new Map(friends.map(friend => [friend.id, friend.name]));
  const selected = friendNames.has(recipient) ? recipient : "";

  const invited = invitedIds.includes(selected);

  return <details className="mini-plan">
    <summary className="cursor-pointer">Invite a friend</summary>
    {friends.length ? <div className="mt-3">
      <div className="invite-friend-picker text-sm font-semibold">
        <IdeaSelect name="recipient" label="Choose a friend" options={friends.map(friend => friend.id)}
          value={selected} onValueChange={setRecipient} getOptionLabel={id => friendNames.get(id) ?? id}
          placeholder="Select a friend" hint="" icon="↗" disabled={pending} />
      </div>
      {invited ? <UninviteFriend key={selected} planId={planId} recipientId={selected} />
        : <form action={action} className="mt-3">
          <input type="hidden" name="plan" value={planId} />
          <input type="hidden" name="recipient" value={selected} />
          <button className="vote-button disabled:opacity-50" type="submit" disabled={pending || !selected}>
            {pending ? "Sending…" : "Send invitation"}
          </button>
          {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
        </form>}
      {invited && <p role="status" className="mt-2 text-sm">Invitation sent.</p>}
    </div> : <Link className="mt-3 inline-block text-sm underline" href="/friends">Add friends to invite them</Link>}
  </details>;
}

export function RespondToInvitation({ planId, senderId }: { planId: string; senderId: string }) {
  const [state, action, pending] = useActionState(respondToInvitation, {});
  return <form action={action} className="mt-3">
    <input type="hidden" name="plan" value={planId} />
    <input type="hidden" name="sender" value={senderId} />
    <div className="flex flex-wrap gap-2">
      <button className="vote-button" type="submit" name="response" value="accepted" disabled={pending}>Accept</button>
      <button className="vote-button" type="submit" name="response" value="declined" disabled={pending}>Decline</button>
    </div>
    {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
  </form>;
}

export function UninviteFriend({ planId, recipientId }: { planId: string; recipientId: string }) {
  const [state, action, pending] = useActionState(withdrawInvitation, {});
  return <form action={action} className="mt-3">
    <input type="hidden" name="plan" value={planId} />
    <input type="hidden" name="recipient" value={recipientId} />
    <button className="vote-button disabled:opacity-50" type="submit" disabled={pending}>
      {pending ? "Withdrawing…" : "Uninvite"}
    </button>
    {state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}
  </form>;
}
