"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/supabase/browser";
type Profile = { first_name: string | null; last_name: string | null; avatar_path: string | null };
export default function ProfileForm({ profile, avatarUrl }: { profile: Profile; avatarUrl: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    const form = new FormData(event.currentTarget);
    const first = String(form.get("first_name") || "").trim();
    const last = String(form.get("last_name") || "").trim();
    let uploadedPath: string | null = null;
    const supabase = createBrowserAuthClient();
    try {
      if (!first || !last || first.length > 100 || last.length > 100) throw new Error("Enter a first and last name, up to 100 characters each.");
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) throw new Error("Your session expired. Please sign in again.");
      let avatarPath = profile.avatar_path;
      if (photo) {
        const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
        if (!extensions[photo.type] || photo.size > 5 * 1024 * 1024) throw new Error("Choose a JPG, PNG, or WebP image under 5 MB.");
        uploadedPath = `${data.user.id}/${crypto.randomUUID()}.${extensions[photo.type]}`;
        const { error: uploadError } = await supabase.storage.from("avatars").upload(uploadedPath, photo, { contentType: photo.type });
        if (uploadError) throw new Error("Photo upload failed. Please try again.");
        avatarPath = uploadedPath;
      }
      const { data: saved, error: saveError } = await supabase.from("profiles").update({ first_name: first, last_name: last, avatar_path: avatarPath }).eq("id", data.user.id).select("id").single();
      if (saveError || !saved) throw new Error("Couldn’t save your profile. Please try again.");
      // Once the profile points to the new photo, never delete it on a cleanup failure.
      uploadedPath = null;
      if (photo && profile.avatar_path) {
        await supabase.storage.from("avatars").remove([profile.avatar_path]).catch(() => undefined);
      }
      router.replace("/club");
      router.refresh();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      setError(error instanceof Error ? error.message : "Couldn’t save your profile."); setBusy(false);
    }
  }
  return <form onSubmit={save} className="panel space-y-6">
    {avatarUrl && <Image unoptimized src={avatarUrl} alt="Your profile photo" width={96} height={96} className="h-24 w-24 rounded-full object-cover" />}
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block font-medium">First name<input className="field" name="first_name" autoComplete="given-name" required maxLength={100} defaultValue={profile.first_name || ""} disabled={busy} /></label>
      <label className="block font-medium">Last name<input className="field" name="last_name" autoComplete="family-name" required maxLength={100} defaultValue={profile.last_name || ""} disabled={busy} /></label>
    </div>
    <label className="block font-medium">Profile photo<input className="field" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => setPhoto(event.target.files?.[0] || null)} /><span className="mt-2 block text-sm font-normal text-zinc-500">Optional. JPG, PNG, or WebP, up to 5 MB.</span></label>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <button className="button" disabled={busy}>{busy ? "Saving…" : "Save profile & enter the club"}</button>
  </form>;
}
