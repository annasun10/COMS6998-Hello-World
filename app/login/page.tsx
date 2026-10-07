import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
import GoogleButton from "./google-button";
export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/club");
  const params = await searchParams;
  return <main className="page-shell"><p className="eyebrow">Side Quest NYC · Members</p><h1 className="page-title">Your next adventure starts here.</h1><p className="my-6 text-zinc-600 dark:text-zinc-400">Sign in to generate NYC side quests, vote on ideas, and create your profile.</p>{params.error && <p role="alert" className="mb-4 text-red-600">Sign-in wasn’t completed. Please try again.</p>}<GoogleButton /></main>;
}
