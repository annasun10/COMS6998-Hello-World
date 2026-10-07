"use client";
import { useState } from "react";
import { createBrowserAuthClient } from "@/lib/supabase/browser";
export default function GoogleButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function signIn() {
    setBusy(true); setError("");
    try {
      const { error } = await createBrowserAuthClient().auth.signInWithOAuth({
        provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch { setError("Couldn’t start Google sign-in. Please try again."); setBusy(false); }
  }
  return <><button className="button" onClick={signIn} disabled={busy}>{busy ? "Connecting…" : "Continue with Google"}</button>{error && <p role="alert" className="mt-4 text-red-600">{error}</p>}</>;
}
