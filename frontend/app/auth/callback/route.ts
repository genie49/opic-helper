import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(`${origin}/login?error=callback_failed`);
    }

    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Get user error:", userError);
      return NextResponse.redirect(`${origin}/login?error=user_failed`);
    }

    try {
      // Check if user profile exists
      const existingProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, user.id))
        .limit(1);

      // Create user profile if it doesn't exist
      if (existingProfile.length === 0) {
        await db.insert(userProfiles).values({
          userId: user.id,
          displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email || "",
          avatarUrl: user.user_metadata?.avatar_url || null,
          currentLevel: "IM2", // Default starting level
          targetLevel: "IH",   // Default target level
        });

        console.log("Created new user profile for:", user.email);
      }
    } catch (dbError) {
      console.error("Database error during profile creation:", dbError);
      // Continue to dashboard even if profile creation fails
      // User can create profile manually later
    }

    // Redirect to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // No code provided
  return NextResponse.redirect(`${origin}/login?error=no_code`);
}
