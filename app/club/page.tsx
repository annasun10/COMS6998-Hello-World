import Link from "next/link";
import { redirect } from "next/navigation";
import { hasNames, requireProfile } from "@/lib/profile";
export default async function Club() {
  const { profile } = await requireProfile();
  if (!hasNames(profile)) redirect("/profile");
  return <main className="page-shell"><p className="eyebrow">Members only</p><h1 className="page-title">Welcome to the club, {profile.first_name}.</h1><p className="my-6 text-zinc-600 dark:text-zinc-400">Your space to discover something new. This page is available exclusively to signed-in players.</p><section className="panel"><h2 className="text-2xl font-semibold">Tonight’s adventure</h2><p className="mt-3 mb-6">Pick a game from the library, invite a friend, and make a little time to play.</p><Link className="button" href="/">Explore the game library</Link></section></main>;
}
