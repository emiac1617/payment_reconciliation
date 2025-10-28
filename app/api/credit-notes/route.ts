import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createSupabaseServerClient()
    const { data, error } = await supabase.from("credit_notes").select("*")

    if (error) {
      console.error("Error fetching credit_notes via server API:", error)
      return NextResponse.json({ error: error.message, data: [] }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    console.error("Unexpected error in credit-notes API:", err)
    return NextResponse.json({ error: err?.message || "Unknown error", data: [] }, { status: 500 })
  }
}