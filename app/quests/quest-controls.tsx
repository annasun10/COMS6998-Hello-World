"use client";
import { useActionState, useState } from "react";
import { createQuest, voteQuest } from "./actions";
import { moods, neighborhoods } from "@/lib/quest-validation";
export function Generator() {
  const [state, action, pending] = useActionState(createQuest, {});
  return <form action={action} className="quest-generator">
    <div><p className="eyebrow">Made for your mood</p><h2 className="text-2xl font-semibold">Turn “we should do something” into a plan.</h2><p className="mt-2 text-sm text-zinc-600">Free public spaces. A little imagination.</p></div>
    <div className="grid gap-4 sm:grid-cols-2"><label className="font-medium">Neighborhood<select name="neighborhood" className="field" disabled={pending}>{neighborhoods.map(n => <option key={n}>{n}</option>)}</select></label><label className="font-medium">Mood<select name="mood" className="field" disabled={pending}>{moods.map(m => <option key={m}>{m}</option>)}</select></label></div>
    <label className="block font-medium">What are you in the mood for?<textarea name="idea" required minLength={3} maxLength={300} rows={3} className="field" placeholder="A cozy afternoon with my roommate after a week of midterms…" disabled={pending} /><span className="mt-2 block text-xs font-normal text-zinc-600">Don’t include personal information. Your preferences stay private; the generated idea will be public.</span></label>
    <button className="button" disabled={pending}>{pending ? "Dreaming up your side quest…" : "✦ Generate a side quest"}</button>
    {state.error && <p role="alert" className="text-red-700">{state.error}</p>}{state.success && <p role="status" className="text-emerald-800">{state.success}</p>}
  </form>;
}
export function VoteButtons({ id, voted }: { id: string; voted?: number }) {
  const [state, action, pending] = useActionState(voteQuest, {});
  if (voted || state.success) return <p className="text-sm font-medium text-emerald-800" role="status">{voted === 1 ? "You voted: Would go" : voted === -1 ? "You voted: Pass" : "Vote saved. Thanks for weighing in!"}</p>;
  return <form action={action}><input type="hidden" name="quest_id" value={id} /><div className="flex gap-3"><button className="vote-button" name="value" value="1" disabled={pending}>↑ Would go</button><button className="vote-button" name="value" value="-1" disabled={pending}>↓ Pass</button></div>{pending && <p role="status" className="mt-2 text-sm">Saving vote…</p>}{state.error && <p role="alert" className="mt-2 text-sm text-red-700">{state.error}</p>}</form>;
}
export function ShareButton({ title, caption }: { title: string; caption: string }) {
  const [message, setMessage] = useState("");
  async function share() {
    try { await navigator.clipboard.writeText(`${title}\n${caption}\nExplore more: ${window.location.origin}/quests`); setMessage("Copied!"); }
    catch { setMessage("Couldn’t copy. Select the caption to share it."); }
  }
  return <div><button onClick={share} className="text-sm underline underline-offset-4">Copy caption</button><span role="status" className="ml-2 text-xs">{message}</span></div>;
}
