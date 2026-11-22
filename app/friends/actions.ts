"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server";

const operations = ["send", "accept", "decline", "cancel", "remove"];

export async function changeFriendship(_previous: string, form: FormData): Promise<string> {
  const person = String(form.get("person") ?? "");
  const operation = String(form.get("operation") ?? "");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(person) || !operations.includes(operation)) {
    return "That friend request is invalid.";
  }

  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "Sign in to manage your friends.";

  const { error } = await supabase.rpc("change_friendship", { person_id: person, operation });
  if (error) {
    console.error("Friend action failed", { code: error.code, operation });
    return error.message === "Both profiles must be complete."
      ? "Both people need a complete profile before sending a request."
      : "Couldn’t update your friends. Try again.";
  }

  revalidatePath("/friends");
  return "";
}
