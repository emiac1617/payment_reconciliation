import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// IMPORTANT: These values MUST be set as environment variables in your Vercel project settings.
// They are only accessed on the server.
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export function createSupabaseServerClient() {
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // The `cookies().set()` method can only be called from a Server Component or Server Action.
          // This error is safe to ignore if you're only calling `cookies().set()` from a Server Component or Server Action.
          console.warn("Could not set cookie from server client:", error)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // The `cookies().set()` method can only be called from a Server Component or Server Action.
          // This error is safe to ignore if you're only calling `cookies().set()` from a Server Component or Server Action.
          console.warn("Could not remove cookie from server client:", error)
        }
      },
    },
  })
}
