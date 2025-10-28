import { NextResponse } from "next/server"
import { DatabaseService, supabase } from "@/lib/supabase/client"

export async function GET(request: Request) {
  const columns = await DatabaseService.detectTableSchema("orders")

  // Detect 'store' or 'Store'
  const storeColumn = columns.includes("store") ? "store" : columns.includes("Store") ? "Store" : null

  let stores: string[] = []
  if (storeColumn) {
    const { data, error } = await supabase.from("orders").select(storeColumn)
    if (!error && data) {
      const set = new Set<string>()
      for (const row of data as Record<string, any>[]) {
        const val = row[storeColumn]
        if (typeof val === "string" && val.trim().length > 0) set.add(val)
      }
      stores = Array.from(set).sort()
    }
  }

  return NextResponse.json({ columns, storeColumn, stores }, { status: 200 })
}