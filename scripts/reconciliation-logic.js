// Reconciliation logic for matching orders with payments
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)

async function runReconciliation() {
  try {
    console.log("Starting reconciliation process...")

    // Fetch all orders
    const { data: orders, error: ordersError } = await supabase.from("orders").select("*")

    if (ordersError) {
      console.error("Error fetching orders:", ordersError)
      return
    }

    // Fetch all payments from different gateways
    const { data: razorpayPayments } = await supabase.from("razorpay").select("*")
    const { data: gokwikPayments } = await supabase.from("gokwik").select("*")
    const { data: snapmintPayments } = await supabase.from("snapmint").select("*")

    // Combine all payments
    const allPayments = [
      ...(razorpayPayments || []).map((p) => ({ ...p, gateway: "razorpay" })),
      ...(gokwikPayments || []).map((p) => ({ ...p, gateway: "gokwik" })),
      ...(snapmintPayments || []).map((p) => ({ ...p, gateway: "snapmint" })),
    ]

    // Process each order
    for (const order of orders) {
      console.log(`Processing order: ${order.order_id}`)

      // Find all payments for this order
      const orderPayments = allPayments.filter((p) => p.order_id === order.order_id)

      // Calculate total payments
      const totalPayments = orderPayments.reduce((sum, payment) => {
        let amount = 0
        if (payment.gateway === "snapmint") {
          amount = Number.parseFloat(payment["Order Value"] || 0)
        } else {
          amount = Number.parseFloat(payment.amount || payment.Amount || 0)
        }
        return sum + amount
      }, 0)

      // Apply adjustment if exists (both positive and negative)
      const adjustedAmount = Number.parseFloat(order.adjusted_amount) || 0
      let finalPaymentAmount = totalPayments
      if (adjustedAmount !== 0) {
        finalPaymentAmount = totalPayments + adjustedAmount
      }

      // Calculate difference
      const difference = Number.parseFloat(order.amount) - finalPaymentAmount

      // Determine status
      let status = "pending"
      if (totalPayments === 0) {
        status = "missing_payment"
      } else if (Math.abs(difference) < 0.01) {
        status = "matched"
      } else {
        status = "discrepancy"
      }

      // Update or insert reconciliation record
      const { error: reconciliationError } = await supabase.from("reconciliation").upsert(
        {
          order_id: order.order_id,
          order_amount: Number.parseFloat(order.amount),
          payment_amount: finalPaymentAmount,
          difference: difference,
          status: status,
          payment_sources: allPayments
            .filter((p) => p.order_id === order.order_id)
            .map((p) => p.gateway)
            .join(", "),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "order_id",
        },
      )

      if (reconciliationError) {
        console.error(`Error updating reconciliation for ${order.order_id}:`, reconciliationError)
      } else {
        console.log(`✓ Reconciled ${order.order_id}: ${status} (diff: ₹${difference.toFixed(2)})`)
      }
    }

    console.log("Reconciliation process completed!")

    // Generate summary
    const { data: summary } = await supabase.from("reconciliation").select("status")

    const statusCounts = summary.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1
      return acc
    }, {})

    console.log("Reconciliation Summary:", statusCounts)
  } catch (error) {
    console.error("Error in reconciliation process:", error)
  }
}

// Run reconciliation
runReconciliation()
