"use client";
import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createBrowserAuthClient } from "@/lib/supabase/browser";
type Profile = { first_name: string | null; last_name: string | null; avatar_path: string | null };
export default function ProfileForm({ profile, avatarUrl }: { profile: Profile; avatarUrl: string | null }) {
  const router = useRouter();
  const photoInput = useRef<HTMLInputElement>(null);
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
      router.replace("/profile");
      router.refresh();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("avatars").remove([uploadedPath]);
      setError(error instanceof Error ? error.message : "Couldn’t save your profile."); setBusy(false);
    }
  }
  return <form onSubmit={save} className="panel space-y-6">
    {avatarUrl && <Image unoptimized src={avatarUrl} alt="Your profile photo" width={96} height={96} className="h-24 w-24 rounded-full object-cover" style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="block font-medium">First name<input className="field" name="first_name" autoComplete="given-name" required maxLength={100} defaultValue={profile.first_name || ""} disabled={busy} /></label>
      <label className="block font-medium">Last name<input className="field" name="last_name" autoComplete="family-name" required maxLength={100} defaultValue={profile.last_name || ""} disabled={busy} /></label>
    </div>
    <div>
      <p id="profile-photo-label" className="font-medium">Profile photo</p>
      <div className="profile-photo-picker">
        <input ref={photoInput} type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy} aria-labelledby="profile-photo-label" onChange={event => setPhoto(event.target.files?.[0] || null)} />
        <button type="button" className="button profile-photo-button" disabled={busy} aria-label="Choose file for profile photo" aria-describedby="profile-photo-help" onClick={() => photoInput.current?.click()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Choose file
        </button>
        <span className="profile-photo-filename" role="status">{photo?.name || "No file selected"}</span>
      </div>
      <p id="profile-photo-help" className="mt-2 text-sm text-zinc-500">Optional. JPG, PNG, or WebP, up to 5 MB.</p>
    </div>
    {error && <p role="alert" className="text-red-600">{error}</p>}
    <button className="button" disabled={busy}>{busy ? "Saving…" : "Save Profile"}</button>
  </form>;
}
