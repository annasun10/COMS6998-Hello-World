import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasNames, requireProfile } from "@/lib/profile";

export default async function Profile() {
  const { supabase, user, profile } = await requireProfile();
  if (!hasNames(profile)) redirect("/profile/edit");

  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl || null;
  }
  const name = `${profile.first_name} ${profile.last_name}`;
  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`;

  return <main className="page-shell">
    <p className="eyebrow">Your corner of Sidequest</p>
    <h1 className="page-title">My Profile</h1>
    <p className="mt-4 mb-8 text-zinc-600">A familiar face for your next city adventure.</p>
    <section className="panel profile-summary" aria-label="Your profile details">
      {avatarUrl ? <Image unoptimized src={avatarUrl} alt={`${name}’s profile photo`} width={112} height={112} className="profile-summary-avatar" style={{ width: 112, height: 112, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} /> : <div className="profile-summary-avatar profile-summary-initials" aria-label="Profile initials">{initials}</div>}
      <div className="profile-summary-details">
        <h2 className="text-3xl font-bold tracking-tight">{name}</h2>
        <p className="mt-2 break-words text-sm text-zinc-600">{user.email}</p>
        <Link href="/profile/edit" className="vote-button mt-5">Edit Profile</Link>
      </div>
    </section>
    <Link href="/quests#create" className="button mt-8">Make a plan <span aria-hidden="true">→</span></Link>
  </main>;
}
