import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server";
import { Generator, ShareButton, VoteButtons } from "./quest-controls";
import { hasNames } from "@/lib/profile";
type Quest = { id: string; creator_id: string; title: string; caption: string; plan: string; neighborhood: string; mood: string; created_at: string; upvotes: number; downvotes: number };
export default async function Quests({ searchParams }: { searchParams: Promise<{ sort?: string; neighborhood?: string }> }) {
  const params = await searchParams;
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: feed, error }, profileResult, votesResult] = await Promise.all([
    supabase.rpc("quest_feed"),
    user ? supabase.from("profiles").select("first_name,last_name").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    user ? supabase.from("quest_votes").select("quest_id,value").eq("user_id", user.id) : Promise.resolve({ data: [] }),
  ]);
  if (error) console.error("Quest feed failed:", error.code);
  const complete = profileResult.data && hasNames(profileResult.data);
  const votes = new Map((votesResult.data || []).map(v => [v.quest_id, v.value]));
  const allQuests = (feed || []) as Quest[];
  let quests = params.neighborhood ? allQuests.filter(q => q.neighborhood === params.neighborhood) : [...allQuests];
  if (params.sort === "top") quests = quests.sort((a,b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes) || b.created_at.localeCompare(a.created_at));
  const promptsResult = user ? await supabase.from("generation_requests").select("id,prompt,system_prompt").eq("user_id", user.id).in("id", allQuests.filter(q => q.creator_id === user.id).map(q => q.id)) : { data: [] };
  const prompts = new Map((promptsResult.data || []).map(p => [p.id, p]));
  return <main className="quest-shell">
    <header className="quest-hero"><p className="eyebrow">Columbia → Everywhere</p><h1>Less doomscroll.<br /><span>More side quest.</span></h1><p className="mt-5 max-w-xl text-lg text-zinc-600">Tiny AI-generated adventures for your next NYC afternoon. Make one, share one, and let the community decide what’s worth leaving the dorm for.</p><div className="mt-6 flex flex-wrap gap-3"><a className="button" href="#create">Make my next move ↗</a><a className="vote-button" href="#feed">Find an idea</a></div></header>
    <section id="create" className="mb-12 scroll-mt-6" aria-label="Create a side quest">{user && complete ? <Generator /> : <div className="quest-generator"><h2 className="text-2xl font-semibold">Your city. Your kind of afternoon.</h2><p>{user ? "Finish your profile to generate ideas and vote." : "Browse freely. Sign in with Google to make an AI side quest and cast your vote."}</p><Link className="button self-start" href={user ? "/profile" : "/login"}>{user ? "Complete profile" : "Sign in to create & vote"}</Link></div>}</section>
    <section id="feed" aria-labelledby="feed-title"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow">The group chat, upgraded</p><h2 id="feed-title" className="text-3xl font-semibold">What’s the move?</h2></div><div className="flex gap-4 text-sm"><Link aria-current={params.sort !== "top" ? "page" : undefined} href="/quests">New</Link><Link aria-current={params.sort === "top" ? "page" : undefined} href="/quests?sort=top">Top rated</Link></div></div>
    <form method="get" className="mb-6 flex flex-wrap items-end gap-3"><input type="hidden" name="sort" value={params.sort === "top" ? "top" : "new"} /><label className="text-sm">Explore a neighborhood<select className="field" name="neighborhood" defaultValue={params.neighborhood || ""}><option value="">All neighborhoods</option>{[...new Set(allQuests.map(q => q.neighborhood))].map(n => <option key={n}>{n}</option>)}</select></label><button className="vote-button">Filter</button></form>
    {error ? <div role="alert" className="panel"><h3 className="font-semibold">The feed is taking a breather.</h3><p className="mt-2">We couldn’t load the ideas. Please try again in a moment.</p><Link href="/quests" className="mt-4 inline-block underline">Try again</Link></div> : quests.length === 0 ? <div className="panel"><h3 className="text-xl font-semibold">{allQuests.length ? "No ideas in this neighborhood yet." : "Be the first to make a move."}</h3><p className="mt-2 text-zinc-600">Generate an adventure above. It’ll appear here for the community to rate.</p></div> : <ul className="grid gap-6 md:grid-cols-2">{quests.map(q => <li className="quest-card" key={q.id}>
      <div className="flex flex-wrap gap-2 text-xs"><span className="quest-tag">{q.neighborhood}</span><span className="quest-tag">{q.mood}</span><span className="quest-tag">AI generated</span></div><h3 className="mt-5 text-2xl font-semibold tracking-tight">{q.title}</h3><p className="mt-3 text-lg leading-relaxed">{q.caption}</p><details className="mt-5"><summary className="cursor-pointer text-sm font-semibold">Open the mini-plan</summary><p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-zinc-600">{q.plan}</p><p className="mt-3 text-xs text-zinc-500">AI inspiration. Check access and conditions before heading out.</p></details>
      <div className="mt-6 border-t border-zinc-200 pt-4"><p className="mb-3 text-sm text-zinc-600">{q.upvotes} would go · {q.downvotes} would pass</p>{!user ? <Link className="text-sm font-semibold underline" href="/login">Sign in to vote</Link> : !complete ? <Link className="text-sm underline" href="/profile">Complete your profile to vote</Link> : <VoteButtons id={q.id} voted={votes.get(q.id)} />}</div><div className="mt-5"><ShareButton title={q.title} caption={q.caption} /></div>
      {prompts.has(q.id) && <details className="mt-4 text-xs text-zinc-500"><summary className="cursor-pointer">Your saved prompts · private</summary><p className="mt-2 whitespace-pre-wrap">System: {prompts.get(q.id)?.system_prompt}</p><p className="mt-2 break-words">Preferences: {prompts.get(q.id)?.prompt}</p></details>}
    </li>)}</ul>}
    <p className="mt-6 text-xs text-zinc-500">Showing the latest 60 ideas. Top rated ranks these by “Would go” minus “Pass.” One vote per account per idea, including your own.</p></section>
  </main>;
}
