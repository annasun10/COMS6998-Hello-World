import { NextResponse, type NextRequest } from "next/server";
import { createAuthClient } from "@/lib/supabase/server";
import { hasNames } from "@/lib/profile";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createAuthClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const { data: profile } = await supabase.from("profiles").select("first_name,last_name").eq("id", data.user.id).single();
      return NextResponse.redirect(new URL(profile && hasNames(profile) ? "/club" : "/profile", request.url));
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", request.url));
}
