import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${request.nextUrl.origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url), { status: 303 });
  }

  if (data.url) {
    // Use 303 status to convert POST to GET redirect
    return NextResponse.redirect(data.url, { status: 303 });
  }

  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}
