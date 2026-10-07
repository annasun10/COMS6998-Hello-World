import { hasNames, requireProfile } from "@/lib/profile";
import ProfileForm from "./profile-form";
export default async function Profile() {
  const { supabase, user, profile } = await requireProfile();
  let avatarUrl: string | null = null;
  if (profile.avatar_path) {
    const { data } = await supabase.storage.from("avatars").createSignedUrl(profile.avatar_path, 3600);
    avatarUrl = data?.signedUrl || null;
  }
  return <main className="page-shell"><p className="eyebrow">Player profile</p><h1 className="page-title">{hasNames(profile) ? "Make it yours." : "Let’s get to know you."}</h1><p className="mt-4 mb-8 text-zinc-600 dark:text-zinc-400">{hasNames(profile) ? "Update your name and profile photo anytime." : "Add your first and last name to finish joining the club."}<span className="mt-2 block text-sm">Signed in as {user.email}</span></p><ProfileForm profile={profile} avatarUrl={avatarUrl} /></main>;
}
