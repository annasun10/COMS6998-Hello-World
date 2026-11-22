"use server";

import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/server";

type InvitationState = { message?: string; error?: string };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function inviteFriend(_state: InvitationState, form: FormData): Promise<InvitationState> {
  const plan = String(form.get("plan") ?? "");
  const recipient = String(form.get("recipient") ?? "");
  if (!uuid.test(plan) || !uuid.test(recipient)) return { error: "Choose a friend to invite." };

  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to invite a friend." };

  const { data, error } = await supabase.rpc("invite_to_plan", { p_plan: plan, recipient });
  if (error) {
    console.error("Plan invitation failed", { code: error.code });
    return { error: "Couldn’t send the invitation. Check that the person is still on your friends list." };
  }

  revalidatePath("/friends");
  revalidatePath("/quests");
  return { message: data ? "Invitation sent." : "You’ve already invited this friend to this plan." };
}

export async function respondToInvitation(_state: InvitationState, form: FormData): Promise<InvitationState> {
  const plan = String(form.get("plan") ?? "");
  const sender = String(form.get("sender") ?? "");
  const response = form.get("response");
  if (!uuid.test(plan) || !uuid.test(sender) || (response !== "accepted" && response !== "declined")) {
    return { error: "That invitation response is invalid." };
  }

  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to respond to the invitation." };

  const { error } = await supabase.rpc("respond_to_plan_invitation", { p_plan: plan, p_sender: sender, response });
  if (error) {
    console.error("Plan invitation response failed", { code: error.code });
    return { error: "Couldn’t update the invitation. Try again." };
  }

  revalidatePath("/friends");
  revalidatePath("/quests");
  return {};
}

export async function withdrawInvitation(_state: InvitationState, form: FormData): Promise<InvitationState> {
  const plan = String(form.get("plan") ?? "");
  const recipient = String(form.get("recipient") ?? "");
  if (!uuid.test(plan) || !uuid.test(recipient)) return { error: "That invitation is invalid." };

  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in to withdraw the invitation." };

  const { error } = await supabase.rpc("withdraw_plan_invitation", { p_plan: plan, p_recipient: recipient });
  if (error) {
    console.error("Plan invitation withdrawal failed", { code: error.code });
    return { error: "Couldn’t withdraw the invitation. Try again." };
  }

  revalidatePath("/friends");
  revalidatePath("/quests");
  return {};
}
