import Link from "next/link";
import { createAuthClient } from "@/lib/supabase/server";
import { signOut } from "@/app/auth/actions";
export default async function Navigation() {
  const supabase = await createAuthClient();
  const { data } = await supabase.auth.getUser();
  return <header className="site-header-sticky"><div className="site-header"><Link href="/quests" className="site-brand"><span className="brand-mark" aria-hidden="true">SQ</span><span>Sidequest</span></Link><nav aria-label="Main navigation" className="site-nav"><Link href="/quests#create">Make a plan</Link><Link href="/quests#feed">Community ideas</Link></nav><div className="account-nav">{data.user ? <><Link href="/profile" className="account-button">My profile</Link><form action={signOut}><button className="signout-button">Sign out</button></form></> : <Link href="/login" className="account-button">Sign in with Google</Link>}</div></div></header>;
}
