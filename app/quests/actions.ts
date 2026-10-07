"use server";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server";
import { supabaseConfig } from "@/lib/supabase/config";
import { generateQuest } from "@/lib/gemini";
import { systemPrompt, validatePreferences } from "@/lib/quest-validation";
export type ActionState = { error?: string; success?: string };
export async function createQuest(_previous: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to create a side quest." };
  let preferences;
  try { preferences = validatePreferences(form); } catch (error) { return { error: (error as Error).message }; }
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!process.env.GEMINI_API_KEY || !secret) return { error: "Generation is temporarily unavailable. Please come back soon." };
  const prompt = JSON.stringify(preferences);
  const { data: id, error: requestError } = await supabase.rpc("reserve_generation", { p_system: systemPrompt, p_prompt: prompt });
  if (requestError) return { error: "Couldn’t start generation. Complete your profile and try again." };
  try {
    const generated = await generateQuest(systemPrompt, prompt);
    const admin = createClient(supabaseConfig().url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.from("quests").insert({ id, creator_id: user.id, ...generated, neighborhood: preferences.neighborhood, mood: preferences.mood });
    if (error) { console.error("Quest save failed:", error.code); return { error: "Couldn’t save your idea. Please try again later." }; }
  } catch (error) {
    return { error: error instanceof Error && error.name === "TimeoutError" ? "AI took too long. Try again later." : error instanceof Error ? error.message : "Generation failed. Please try again." };
  }
  revalidatePath("/quests");
  return { success: "Your side quest is live! Find it in the New feed below." };
}
export async function voteQuest(_previous: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to vote." };
  const id = String(form.get("quest_id") || "");
  const value = Number(form.get("value"));
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) || ![-1,1].includes(value)) return { error: "Invalid vote." };
  const { error } = await supabase.from("quest_votes").insert({ quest_id: id, user_id: user.id, value });
  if (error) return { error: error.code === "23505" ? "You’ve already voted on this idea." : "Couldn’t vote. Check that your profile is complete and try again." };
  revalidatePath("/quests");
  return { success: "Vote saved." };
}
