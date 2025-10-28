import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase/client"
import { DatabaseService } from "@/lib/supabase/client"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const store = url.searchParams.get("store")

    const columns = await DatabaseService.detectTableSchema("orders")
    // Prefer lowercase 'store', but support existing 'Store' column from data
    const storeColumn = columns.includes("store")
      ? "store"
      : columns.includes("Store")
        ? "Store"
        : null

    let query = supabase.from("orders").select("*")

    if (store) {
      if (!storeColumn) {
        return NextResponse.json(
          { error: "Store column not found in orders. Add 'store' to schema or use existing 'Store'." },
          { status: 400 }
        )
      }
      query = query.eq(storeColumn, store)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, meta: { storeColumn } }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 })
  }
}