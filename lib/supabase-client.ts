import { createClient } from "@supabase/supabase-js"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

// IMPORTANT: Hardcoded for v0 preview environment ONLY.
// For actual Vercel deployment, use process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = "https://recon.emiactech.com/"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY"

// Client-side Supabase client (for browser interactions)
// In dev/preview, disable background token refresh to avoid noisy console errors
const isProd = process.env.NODE_ENV === "production"
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: isProd,
    persistSession: isProd,
  },
})

// Server-side Supabase client (for Server Components/Actions)
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  // For server-side, you would typically use process.env.SUPABASE_URL and process.env.SUPABASE_ANON_KEY.
  // The hardcoded values here are for v0 preview consistency.
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

// Database service functions (using the client-side supabase for now, can be updated to use server client for specific actions)
export class DatabaseService {
  // Type for reconciliation update input rows
  // Adjust fields if your table expects different names
  // (e.g., if it uses `total_payments` from `payment_amount`, we map below)
  
  static async detectTableSchema(tableName: string) {
  static async detectTableSchema(tableName: string) {
    try {
      const { data, error } = await supabase.from(tableName).select("*").limit(1)

      if (error) {
        console.error(`Error checking ${tableName} schema:`, error)
        return []
      }

      const columns = data && data.length > 0 ? Object.keys(data[0]) : []
      console.log(`${tableName} table columns:`, columns)
      return columns
    } catch (error) {
      console.error(`Schema detection error for ${tableName}:`, error)
      return []
    }
  }

  static async getOrders() {
    try {
      console.log("Fetching orders...")
      const { data: allOrders, error: ordersError } = await supabase.from("orders").select("*")

      if (ordersError) {
        console.error("Orders fetch error:", ordersError)
        return []
      }

      console.log(`Fetched ${allOrders?.length || 0} orders`)
      return allOrders || []
    } catch (error) {
      console.error("Error fetching orders:", error)
      return []
    }
  }

  static async getAllPaymentTables() {
    try {
      console.log("Fetching all payment and shipping data...")

      const [razorpayRes, gokwikRes, shiprocketRes, nimbusRes, bluedartRes, delhiveryRes, snapmintRes] = await Promise.all([
        supabase
          .from("razorpay")
          .select("*"), // Corrected table name
        supabase
          .from("gokwik")
          .select("*"), // Corrected table name
        supabase
          .from("shiprocket")
          .select("*"), // Corrected table name
        supabase
          .from("nimbus")
          .select("*"), // Corrected table name
        supabase
          .from("bluedart")
          .select("*"), // Corrected table name
        supabase
          .from("delhivery")
          .select("*"), // Corrected table name
        supabase
          .from("snapmint")
          .select("*"),
      ])

      const results = {
        razorpay: razorpayRes.data || [],
        gokwik: gokwikRes.data || [],
        shiprocket: shiprocketRes.data || [],
        nimbus: nimbusRes.data || [],
        bluedart: bluedartRes.data || [],
        delhivery: delhiveryRes.data || [],
        snapmint: snapmintRes.data || [],
      }

      console.log("Payment table data counts:", {
        razorpay: results.razorpay.length,
        gokwik: results.gokwik.length,
        shiprocket: results.shiprocket.length,
        nimbus: results.nimbus.length,
        bluedart: results.bluedart.length,
        delhivery: results.delhivery.length,
        snapmint: results.snapmint.length,
      })

      return results
    } catch (error) {
      console.error("Error fetching payment tables:", error)
      return {
        razorpay: [],
        gokwik: [],
        shiprocket: [],
        nimbus: [],
        bluedart: [],
        delhivery: [],
        snapmint: [],
      }
    }
  }

  static async getReconciliation() {
    try {
      const { data, error } = await supabase.from("reconciliation").select("*")

      if (error) {
        console.error("Reconciliation fetch error:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error fetching reconciliation:", error)
      return []
    }
  }

  // Minimal shape for reconciliation upsert
  type ReconciliationUpdateInput = {
    order_id: string
    order_amount: number
    payment_amount: number
    difference: number
    status: "matched" | "discrepancy" | "match_pending" | "orphaned_order"
  }

  static async updateReconciliation(reconciliationData: ReconciliationUpdateInput[]) {
    try {
      const { error } = await supabase.from("reconciliation").upsert(
        reconciliationData.map((r: ReconciliationUpdateInput) => ({
          order_id: r.order_id,
          order_amount: r.order_amount,
          total_payments: r.payment_amount,
          difference: r.difference,
          status: r.status,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "order_id" },
      )

      if (error) {
        console.error("Reconciliation update error:", error)
        throw error
      }

      return true
    } catch (error) {
      console.error("Error updating reconciliation:", error)
      throw error
    }
  }
}
