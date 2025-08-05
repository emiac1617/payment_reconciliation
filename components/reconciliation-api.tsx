"use client"

import { createClient } from "@supabase/supabase-js"

// IMPORTANT: Hardcoded for v0 preview environment ONLY.
// For actual Vercel deployment, use process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = "https://recon.emiactech.com/"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY"

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export class ReconciliationAPI {
  // Fetch all orders
  static async getOrders() {
    const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  // Fetch payments from all gateways
  static async getAllPayments() {
    const [razorpay, gokwik] = await Promise.all([
      supabase.from("razorpay").select("*"),
      supabase.from("gokwik").select("*"),
    ])

    const payments = [
      ...(razorpay.data || []).map((p) => ({ ...p, gateway: "razorpay" })),
      ...(gokwik.data || []).map((p) => ({ ...p, gateway: "gokwik" })),
    ]

    return payments
  }

  // Fetch shipping data from all providers
  static async getAllShippingData() {
    const [shiprocket, nimbus, bluedart, delhivery] = await Promise.all([
      supabase.from("shipping_shiprocket").select("*"),
      supabase.from("shipping_nimbus").select("*"),
      supabase.from("shipping_bluedart").select("*"),
      supabase.from("shipping_delhivery").select("*"),
    ])

    return {
      shiprocket: shiprocket.data || [],
      nimbus: nimbus.data || [],
      bluedart: bluedart.data || [],
      delhivery: delhivery.data || [],
    }
  }

  // Get reconciliation data
  static async getReconciliation() {
    const { data, error } = await supabase.from("reconciliation").select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  // Run reconciliation process
  static async runReconciliation() {
    try {
      const orders = await this.getOrders()
      const payments = await this.getAllPayments()

      const reconciliationData = []

      for (const order of orders) {
        const orderPayments = payments.filter((p) => p.order_id === order.order_id)
        const totalPayments = orderPayments.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0)
        const difference = Number.parseFloat(order.amount) - totalPayments

        let status = "pending"
        if (totalPayments === 0) {
          status = "missing_payment"
        } else if (Math.abs(difference) < 0.01) {
          status = "matched"
        } else {
          status = "discrepancy"
        }

        reconciliationData.push({
          order_id: order.order_id,
          order_amount: Number.parseFloat(order.amount),
          total_payments: totalPayments,
          difference: difference,
          status: status,
          updated_at: new Date().toISOString(),
        })
      }

      // Batch upsert reconciliation data
      const { error } = await supabase.from("reconciliation").upsert(reconciliationData, { onConflict: "order_id" })

      if (error) throw error
      return reconciliationData
    } catch (error) {
      console.error("Reconciliation error:", error)
      throw error
    }
  }

  // Get dashboard statistics
  static async getDashboardStats() {
    const [orders, payments, reconciliation] = await Promise.all([
      this.getOrders(),
      this.getAllPayments(),
      this.getReconciliation(),
    ])

    const totalOrders = orders.length
    const totalPaymentReceived = payments.reduce((sum, p) => sum + Number.parseFloat(p.amount || 0), 0)
    const missingPayments = reconciliation.filter((r) => r.status === "missing_payment").length
    const discrepancies = reconciliation.filter((r) => r.status === "discrepancy").length

    return {
      totalOrders,
      totalPaymentReceived,
      missingPayments,
      discrepancies,
    }
  }
}

export default ReconciliationAPI
