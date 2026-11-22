import { InviteFriend } from "../friends/invitation-controls";
import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server";
import QuestPlan from "./quest-plan";
import FeedFilters from "./feed-filters";
import { Generator, ShareButton, VoteButtons } from "./quest-controls";
import { boroughForLocation } from "@/lib/quest-validation";
import { hasNames } from "@/lib/profile";
type Plan = { id: string; title: string; caption: string; plan: string; neighborhood: string; mood: string; created_at: string };
type Quest = Plan & { upvotes: number; downvotes: number };
function PlanCard({ plan, invitation, children }: { plan: Plan; invitation: React.ReactNode; children?: React.ReactNode }) {
  return <li className="quest-card">
    <div className="quest-card-content">
      <div className="quest-card-tags">
        <span className="quest-tag" data-borough={plan.neighborhood}>{plan.neighborhood}</span>
        <span className="quest-tag" data-mood={plan.mood}>{plan.mood}</span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-tight">{plan.title}</h3>
      <p className="mt-3 text-lg leading-relaxed">{plan.caption}</p>
      <QuestPlan plan={plan.plan} />
      {invitation}
      {children}
      <div className="mt-5"><ShareButton title={plan.title} caption={plan.caption} /></div>
    </div>
  </li>;
}
export default async function Quests({ searchParams }: { searchParams: Promise<{ sort?: string; neighborhood?: string; mood?: string; q?: string | string[] }> }) {
  const params = await searchParams;
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: feed, error }, profileResult, votesResult, myPlansResult, friendsResult, invitationsResult] = await Promise.all([
    supabase.rpc("quest_feed"),
    user ? supabase.from("profiles").select("first_name,last_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("quest_votes").select("quest_id,value").eq("user_id", user.id) : Promise.resolve({ data: [] }),
    user ? supabase.from("quests").select("id,title,caption,plan,neighborhood,mood,created_at").eq("creator_id", user.id).order("created_at", { ascending: false }) : Promise.resolve({ data: [], error: null }),
    user ? supabase.rpc("friend_people", { search_name: "" }) : Promise.resolve({ data: [], error: null }),
    user ? supabase.rpc("my_plan_invitations") : Promise.resolve({ data: [], error: null }),
  ]);
  if (error) console.error("Quest feed failed:", error.code);
  if (myPlansResult.error) console.error("My plans failed:", myPlansResult.error.code);
  if (friendsResult.error) console.error("Plan invite friends failed:", friendsResult.error.code);
  const connections: { id: string; name: string; relationship: string }[] = friendsResult.data ?? [];
  const friends = connections.filter(person => person.relationship === "friend");
  if (invitationsResult.error) console.error("Plan invite status failed:", invitationsResult.error.code);
  const invitations: { plan_id: string; recipient_id: string; incoming: boolean }[] = invitationsResult.data ?? [];
  const invitedByPlan = new Map<string, string[]>();
  for (const invitation of invitations) {
    if (invitation.incoming) continue;
    const recipients = invitedByPlan.get(invitation.plan_id) ?? [];
    recipients.push(invitation.recipient_id);
    invitedByPlan.set(invitation.plan_id, recipients);
  }
  const myPlans = (myPlansResult.data || []).map(plan => ({ ...plan, neighborhood: boroughForLocation(plan.neighborhood) }));
  const complete = profileResult.data && hasNames(profileResult.data);
  const votes = new Map((votesResult.data || []).map(v => [v.quest_id, v.value]));
  const allQuests = ((feed || []) as Quest[]).map(q => ({ ...q, neighborhood: boroughForLocation(q.neighborhood) }));
  const boroughs = [...new Set(allQuests.map(q => q.neighborhood))];
  const moods = [...new Set(allQuests.map(q => q.mood))];
  const neighborhood = params.neighborhood && boroughs.includes(params.neighborhood) ? params.neighborhood : "";
  const mood = params.mood && moods.includes(params.mood) ? params.mood : "";
  const search = typeof params.q === "string" ? params.q.trim() : "";
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  const quests = allQuests.filter(q => {
    const searchableText = [q.title, q.caption, q.plan, q.neighborhood, q.mood].join(" ").toLowerCase();
    return (!neighborhood || q.neighborhood === neighborhood)
      && (!mood || q.mood === mood)
      && terms.every(term => searchableText.includes(term));
  });
  const filterQuery = new URLSearchParams();
  if (neighborhood) filterQuery.set("neighborhood", neighborhood);
  if (mood) filterQuery.set("mood", mood);
  if (search) filterQuery.set("q", search);
  const newHref = filterQuery.size ? `/quests?${filterQuery}#feed` : "/quests#feed";
  filterQuery.set("sort", "top");
  const topHref = `/quests?${filterQuery}#feed`;
  if (params.sort === "top") quests.sort((a,b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) || b.created_at.localeCompare(a.created_at));
  function friendInvite(planId: string) {
    if (!user) return null;
    return friendsResult.error || invitationsResult.error
      ? <p className="mt-3 text-sm">Friend invitations are temporarily unavailable.</p>
      : <InviteFriend planId={planId} friends={friends} invitedIds={invitedByPlan.get(planId) ?? []} />;
  }

  return <main className="quest-shell">
    <header className="quest-hero">
      <div className="hero-copy"><p className="hero-sticker">NYC has plans for you</p><h1>Find your next<span>NYC story.</span></h1><p className="hero-description">Tell us where you want to go and how you want to feel. We’ll dream up a one-of-a-kind day in the city.</p><a className="button hero-cta" href="#create">Find me something to do <span aria-hidden="true">→</span></a></div>
      <div className="hero-photo"><div className="hero-photo-backdrop" /><img src="https://images.unsplash.com/photo-1665399319700-90b454c69d1e?auto=format&fit=crop&w=1000&q=85" alt="A lively New York City neighborhood street" fetchPriority="high" /><div className="hero-photo-note"><p>Today’s energy</p><strong>Go somewhere new.</strong></div></div>
    </header>
    <section id="create" className="generator-section" aria-labelledby="generator-title"><div className="generator-layout"><div className="generator-intro"><p className="eyebrow">Your personal idea machine</p><h2 id="generator-title">What are you in the mood for?</h2><p>Pick your borough and your mood. We’ll handle the overthinking.</p></div>{user && complete ? <Generator /> : <div className="quest-generator"><h3 className="text-2xl font-bold">Your city. Your kind of afternoon.</h3><p className="text-zinc-600">{user ? "Finish your profile to generate ideas and vote." : "Browse freely. Sign in with Google to make an AI side quest and cast your vote."}</p><div className="generator-preview" aria-hidden="true"><div><span>Borough</span><strong>Somewhere new ↗</strong></div><div><span>Mood</span><strong>Your kind of day ✦</strong></div></div><Link className="button" href={user ? "/profile" : "/login"}>{user ? "Complete profile" : "Sign in to create & vote"}<span aria-hidden="true">→</span></Link></div>}</div></section>
    <section id="feed" className={user ? "feed-with-my-plans" : undefined} aria-labelledby="feed-title"><div className="feed-heading"><div><p className="eyebrow">Fresh from the five boroughs</p><h2 id="feed-title" className="feed-title">Community ideas</h2></div><div className="feed-sorting"><Link aria-current={params.sort !== "top" ? "page" : undefined} href={newHref}>New</Link><Link aria-current={params.sort === "top" ? "page" : undefined} href={topHref}>Top rated</Link></div></div>
    <p className="feed-description">Real ideas generated by curious New Yorkers. Vote for the ones you’d actually leave the apartment for.</p>
    <FeedFilters boroughs={boroughs} moods={moods} neighborhood={neighborhood} mood={mood} search={search} sort={params.sort} />
    {error ? <div role="alert" className="panel"><h3 className="font-semibold">The feed is taking a breather.</h3><p className="mt-2">We couldn’t load the ideas. Please try again in a moment.</p><Link href="/quests" className="mt-4 inline-block underline">Try again</Link></div> : quests.length === 0 ? <div className="panel"><h3 className="text-xl font-semibold">{allQuests.length ? "No matching plans." : "Be the first to make a move."}</h3><p className="mt-2 text-zinc-600">{allQuests.length ? "Try a different search or change the filters." : "Generate an adventure above. It’ll appear here for the community to rate."}</p></div> : <ul className="quest-grid">{quests.map(q => <PlanCard key={q.id} plan={q} invitation={friendInvite(q.id)}>
      <div className="mt-6 border-t border-zinc-200 pt-4"><p className="mb-3 text-sm text-zinc-600">{q.upvotes} would go · {q.downvotes} would pass</p>{!user ? <Link className="text-sm font-semibold underline" href="/login">Sign in to vote</Link> : !complete ? <Link className="text-sm underline" href="/profile">Complete your profile to vote</Link> : <VoteButtons id={q.id} voted={votes.get(q.id)} />}</div>
    </PlanCard>)}</ul>}
    <p className="mt-6 text-xs text-zinc-500">Showing the latest 60 ideas. Top rated ranks these by “Would go” minus “Pass.” One vote per account per idea, including your own. You can change your vote anytime.</p></section>
    {user && <section id="my-plans" aria-labelledby="my-plans-title">
      <h2 id="my-plans-title" className="feed-title">My plans</h2>
      {myPlansResult.error ? <p role="alert" className="panel">We couldn’t load your plans. Please try again in a moment.</p>
        : myPlans.length ? <ul className="quest-grid">{myPlans.map(plan => <PlanCard key={plan.id} plan={plan} invitation={friendInvite(plan.id)} />)}</ul>
        : <div className="panel">
          <p>You haven’t created any plans yet.</p>
          <a className="mt-2 inline-block underline" href="#create">Create a plan</a>
        </div>}
    </section>}
  <footer className="site-footer"><span>Sidequest NYC</span><span>Made for wandering.</span></footer></main>;
}
