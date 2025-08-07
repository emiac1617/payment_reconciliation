// Script to add shipped_order_number and transaction_type data to existing orders
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://recon.emiactech.com/"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY"

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateOrderData() {
  try {
    console.log('🔄 Fetching existing orders...')
    
    // First, get all existing orders
    const { data: orders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
    
    if (fetchError) {
      console.error('❌ Error fetching orders:', fetchError)
      return
    }
    
    console.log(`📊 Found ${orders.length} orders to update`)
    
    // Update each order with sample data
    for (const order of orders) {
      const orderId = String(order.order_id || order.id || 'UNKNOWN')
      const orderNum = orderId.includes('ORD') ? orderId.replace('ORD', '') : orderId.slice(-3)
      const shippedOrderNumber = `SHIP${orderNum.padStart(3, '0')}`
      
      let transactionType = 'pending'
      if (order.payment_status === 'paid') {
        transactionType = 'completed'
      } else if (order.payment_status === 'pending') {
        transactionType = 'processing'
      }
      
      console.log(`Processing order: ${orderId} -> ${shippedOrderNumber}`)
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          shipped_order_number: shippedOrderNumber,
          transaction_type: transactionType
        })
        .eq('id', order.id)
      
      if (updateError) {
        console.error(`❌ Error updating order ${order.order_id}:`, updateError)
      } else {
        console.log(`✅ Updated order ${order.order_id} -> ${shippedOrderNumber} (${transactionType})`)
      }
    }
    
    console.log('🎉 All orders updated successfully!')
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the update
updateOrderData()