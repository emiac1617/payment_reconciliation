// IMPORTANT: Hardcoded for v0 preview environment ONLY.
// For actual Vercel deployment, use process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
import { createClient } from "@supabase/supabase-js"
import { mockShipwayData } from "../mock-shipway-data.js"

const supabaseUrl = "https://recon.emiactech.com/"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database service functions (using the client-side supabase)
export class DatabaseService {
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

      const [razorpayRes, gokwikRes, shiprocketRes, nimbusRes, bluedartRes, delhiveryRes, snapmintRes, shipwayRes] = await Promise.all([
        supabase.from("razorpay").select("*"),
        supabase.from("gokwik").select("*"),
        supabase.from("shiprocket").select("*"),
        supabase.from("nimbus").select("*"),
        supabase.from("bluedart").select("*"),
        supabase.from("delhivery").select("*"),
        supabase.from("snapmint").select("*"),
        supabase.from("shipway").select("*"),
      ])

      // Debug snapmint specifically
      console.log("Snapmint fetch result:", {
        data: snapmintRes.data,
        error: snapmintRes.error,
        count: snapmintRes.count
      })

      // Handle shipway table - use mock data if table doesn't exist
      let shipwayData = shipwayRes.data || []
      if (shipwayRes.error && shipwayRes.error.code === '42P01') {
        console.log('Shipway table not found, using mock data')
        shipwayData = mockShipwayData
      }

      const results = {
        razorpay: razorpayRes.data || [],
        gokwik: gokwikRes.data || [],
        shiprocket: shiprocketRes.data || [],
        nimbus: nimbusRes.data || [],
        bluedart: bluedartRes.data || [],
        delhivery: delhiveryRes.data || [],
        snapmint: snapmintRes.data || [],
        shipway: shipwayData,
      }

      console.log("Payment table data counts:", {
        razorpay: results.razorpay.length,
        gokwik: results.gokwik.length,
        shiprocket: results.shiprocket.length,
        nimbus: results.nimbus.length,
        bluedart: results.bluedart.length,
        delhivery: results.delhivery.length,
        snapmint: results.snapmint.length,
        shipway: results.shipway.length,
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
        shipway: mockShipwayData,
      }
    }
  }

  static async getAllShippingData() {
    const [shiprocket, nimbus, bluedart, delhivery] = await Promise.all([
      supabase.from("shiprocket").select("*"),
      supabase.from("nimbus").select("*"),
      supabase.from("bluedart").select("*"),
      supabase.from("delhivery").select("*"),
    ])

    return {
      shiprocket: shiprocket.data || [],
      nimbus: nimbus.data || [],
      bluedart: bluedart.data || [],
      delhivery: delhivery.data || [],
    }
  }

  static async updateOrderReconciliation(orderId: string, adjustedAmount: number, remark: string) {
    try {
      console.log("Updating order reconciliation:", { orderId, adjustedAmount, remark })

      // Update the record directly with optimized single query
      const { data, error } = await supabase
        .from("orders")
        .update({
          adjusted_amount: adjustedAmount,
          remark: remark,
        })
        .eq("order_id", orderId)
        .select("order_id, adjusted_amount, remark")
        .single()

      if (error) {
        console.error("Error updating order reconciliation:", error)
        throw new Error(`Database update failed: ${error.message}`)
      }

      if (!data) {
        throw new Error("No records were updated. Order ID may not exist.")
      }

      console.log("Successfully updated order reconciliation:", data)
      return data
    } catch (error) {
      console.error("Error in updateOrderReconciliation:", error)
      throw error
    }
  }

  static async checkReconciliationColumnsExist() {
    try {
      // Try to select the reconciliation columns to see if they exist
      const { data, error } = await supabase.from("orders").select("adjusted_amount, remark").limit(1)

      if (error) {
        console.error("Reconciliation columns may not exist:", error)
        // If the columns don't exist, the error will mention them
        if (error.message.includes("adjusted_amount") || error.message.includes("remark")) {
          return false
        }
        return true
      }

      console.log("Reconciliation columns exist and are accessible")
      return true
    } catch (error) {
      console.error("Error checking reconciliation columns:", error)
      return false
    }
  }

  static async ensureReconciliationColumns() {
    try {
      // Try to select the columns to see if they exist
      const { data, error } = await supabase.from("orders").select("adjusted_amount, remark").limit(1)

      if (error) {
        console.error("Reconciliation columns may not exist:", error)
        return false
      }

      console.log("Reconciliation columns exist and are accessible")
      return true
    } catch (error) {
      console.error("Error checking reconciliation columns:", error)
      return false
    }
  }
}
