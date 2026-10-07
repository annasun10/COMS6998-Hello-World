import "server-only";
import { redirect } from "next/navigation";
import { createAuthClient } from "@/lib/supabase/server";
export async function requireProfile() {
  const supabase = await createAuthClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  const { data: profile, error: profileError } = await supabase.from("profiles")
    .select("first_name,last_name,avatar_path").eq("id", data.user.id).maybeSingle();
  if (profileError) {
    console.error("Supabase profile lookup failed:", { code: profileError.code, message: profileError.message });
    throw new Error("Unable to load your profile. Check that the profiles migration has been applied.");
  }
  if (!profile) {
    console.error("Supabase profile lookup returned no row. Check the auth.users trigger, profile backfill, and SELECT policy.");
    throw new Error("Your profile is missing or inaccessible. Check the profile trigger, backfill, and permissions.");
  }
  return { supabase, user: data.user, profile };
}
export function hasNames(profile: { first_name: string | null; last_name: string | null }) {
  return Boolean(profile.first_name?.trim() && profile.last_name?.trim());
}
