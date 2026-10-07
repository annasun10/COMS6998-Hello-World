import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
export default async function Navigation() {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  return <nav aria-label="Main navigation" className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800"><Link href="/" className="font-bold tracking-tight">Game Library</Link><div className="flex items-center gap-5 text-sm"><Link href="/">Games</Link>{data.user ? <><Link href="/club">Club</Link><Link href="/profile">Profile</Link><form action={signOut}><button className="cursor-pointer underline underline-offset-4">Sign out</button></form></> : <Link href="/login" className="button">Sign in</Link>}</div></nav>;
}
