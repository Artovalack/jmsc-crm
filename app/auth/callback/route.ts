import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  if (!isSupabaseConfigured()) return NextResponse.redirect(new URL("/setup", origin));
  const code = searchParams.get("code");
  const requestedPath = searchParams.get("next");
  const nextPath = requestedPath?.startsWith("/") && !requestedPath.startsWith("//") ? requestedPath : "/dashboard";

  if (!code) return NextResponse.redirect(new URL("/login?error=Confirmation%20code%20is%20missing.", origin));
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("Could not exchange the Supabase auth callback code.", error);
    return NextResponse.redirect(new URL("/login?error=Email%20confirmation%20could%20not%20be%20completed.", origin));
  }
  return NextResponse.redirect(new URL(nextPath, origin));
}
