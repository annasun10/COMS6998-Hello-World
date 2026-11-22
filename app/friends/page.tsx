import QuestPlan from "../quests/quest-plan";
import { RespondToInvitation, UninviteFriend } from "./invitation-controls";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import FriendControls, { type Relationship } from "./friend-controls";

type Person = { id: string; name: string; relationship: Relationship };

type Invitation = {
  plan_id: string;
  recipient_id: string;
  sender_id: string;
  title: string;
  itinerary: string;
  person_name: string;
  status: "pending" | "accepted" | "declined";
  incoming: boolean;
};

const invitationStatus = { pending: "Pending", accepted: "Accepted", declined: "Declined" };

const groups = [
  { title: "Search results", relationship: "available", empty: "No new people match that name." },
  { title: "Incoming requests", relationship: "received", empty: "No incoming requests." },
  { title: "Sent requests", relationship: "sent", empty: "No sent requests." },
  { title: "My friends", relationship: "friend", empty: "No friends yet. Search for someone by name to send a request." },
] as const;

export default async function Friends({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data, error }, invitationsResult] = await Promise.all([
    supabase.rpc("friend_people", { search_name: search }),
    supabase.rpc("my_plan_invitations"),
  ]);
  if (invitationsResult.error) console.error("Plan invitations failed", { code: invitationsResult.error.code });
  const invitations: Invitation[] = invitationsResult.data ?? [];
  if (error) console.error("Friends list failed", { code: error.code });
  const people: Person[] = data ?? [];

  return <main className="friends-page">
    <h1 className="feed-title">Friends</h1>
    <form role="search" aria-label="Find people" className="friends-search" action="/friends">
      <label htmlFor="friend-search" className="font-semibold">Find people by name</label>
      <div className="friends-search-controls">
        <input id="friend-search" name="q" type="search" className="field" defaultValue={search}
          placeholder="First or last name" minLength={2} maxLength={100} required />
        <button className="vote-button" type="submit">Search</button>
      </div>
    </form>
    {error ? <p role="alert" className="panel friends-section">We couldn’t load your friends. Try again in a moment.</p> :
      groups.filter(group => group.relationship !== "available" || search.length >= 2).map(group => {
        const members = people.filter(person => person.relationship === group.relationship);
        return <section className="friends-section" key={group.relationship} aria-labelledby={`friends-${group.relationship}`}>
          <h2 id={`friends-${group.relationship}`} className="text-xl font-semibold">{group.title}</h2>
          {members.length ? <ul className="space-y-2">{members.map(person =>
            <li className="panel flex flex-wrap items-center justify-between gap-3" key={person.id}>
              <span className="break-all font-medium">{person.name}</span>
              <FriendControls id={person.id} relationship={person.relationship} />
            </li>
          )}</ul> : <p className="text-sm text-zinc-600">{group.empty}</p>}
        </section>;
      })}
    <section className="friends-section" aria-labelledby="plan-invitations">
      <h2 id="plan-invitations" className="text-xl font-semibold">Plan invitations</h2>
      {invitationsResult.error ? <p role="alert" className="text-sm">We couldn’t load your plan invitations.</p>
        : invitations.length ? <ul className="space-y-2">{invitations.map(invitation =>
          <li className="panel" key={`${invitation.plan_id}-${invitation.sender_id}-${invitation.recipient_id}`}>
            <h3 className="font-semibold">{invitation.title}</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {invitation.incoming ? "From" : "To"} {invitation.person_name} · {invitationStatus[invitation.status]}
            </p>
            <QuestPlan plan={invitation.itinerary} />
            {!invitation.incoming && <UninviteFriend planId={invitation.plan_id} recipientId={invitation.recipient_id} />}
            {invitation.incoming && invitation.status === "pending" && <RespondToInvitation planId={invitation.plan_id} senderId={invitation.sender_id} />}
          </li>
        )}</ul> : <p className="text-sm text-zinc-600">No plan invitations yet.</p>}
    </section>
  </main>;
}
