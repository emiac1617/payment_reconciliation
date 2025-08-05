import { createSupabaseServerClient } from "@/lib/supabase/server" // Updated import path
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type") // Used for email confirmation

  if (code) {
    const supabase = createSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Successfully exchanged code, user is logged in
      return NextResponse.redirect(requestUrl.origin) // Redirect to dashboard
    }
  }

  // If no code or an error occurred, redirect to an error page or login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=auth_failed`)
}
