const { createClient } = require('@supabase/supabase-js')

// Hardcode the values from .env.local for this script
const supabaseUrl = 'https://recon.emiactech.com/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupShipwayTable() {
  try {
    console.log('🔧 Setting up shipway table...')
    
    // First, try to create the table using a workaround
    // Since we can't execute DDL directly, we'll try to insert and handle the error
    const testData = {
      order_number: 'TEST001',
      'Order Value': 100.00,
      order_id: 'TEST001'
    }
    
    console.log('📋 Attempting to insert test data...')
    const { data, error } = await supabase
      .from('shipway')
      .insert([testData])
      .select()
    
    if (error) {
      if (error.code === '42P01') {
        console.log('❌ Shipway table does not exist!')
        console.log('\n🔧 MANUAL SETUP REQUIRED:')
        console.log('\n1. Go to Supabase SQL Editor: https://recon.emiactech.com/project/default/sql')
        console.log('\n2. Execute this SQL:')
        console.log('\n' + '='.repeat(80))
        console.log(`-- Create shipway table\nCREATE TABLE IF NOT EXISTS public.shipway (\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n  order_number VARCHAR(255),\n  "Order Value" NUMERIC(10,2),\n  order_id VARCHAR(50) NOT NULL,\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n\n-- Create indexes\nCREATE INDEX IF NOT EXISTS idx_shipway_order_id ON public.shipway(order_id);\nCREATE INDEX IF NOT EXISTS idx_shipway_created_at ON public.shipway(created_at);\n\n-- Insert sample data\nINSERT INTO public.shipway (order_number, "Order Value", order_id) VALUES\n('SW001', 1500.00, 'ORD001'),\n('SW002', 2300.50, 'ORD002'),\n('SW003', 899.99, 'ORD003'),\n('SW004', 3200.00, 'ORD004'),\n('SW005', 750.25, 'ORD005'),\n('SW006', 1200.75, 'ORD006'),\n('SW007', 2800.00, 'ORD007'),\n('SW008', 650.50, 'ORD008'),\n('SW009', 4500.25, 'ORD009'),\n('SW010', 1850.00, 'ORD010');\n\n-- Enable RLS (Row Level Security)\nALTER TABLE public.shipway ENABLE ROW LEVEL SECURITY;\n\n-- Create policy to allow all operations (adjust as needed)\nCREATE POLICY "Allow all operations on shipway" ON public.shipway\nFOR ALL USING (true) WITH CHECK (true);`)
        console.log('='.repeat(80))
        console.log('\n3. After executing the SQL, run this script again to verify')
        console.log('\n4. Then refresh your application at http://localhost:3000')
        return false
      } else {
        console.error('❌ Other error:', error)
        return false
      }
    } else {
      console.log('✅ Shipway table exists and is working!')
      console.log('📊 Test data inserted successfully')
      
      // Clean up test data
      await supabase.from('shipway').delete().eq('order_id', 'TEST001')
      
      // Insert proper sample data
      const sampleData = [
        { order_number: 'SW001', 'Order Value': 1500.00, order_id: 'ORD001' },
        { order_number: 'SW002', 'Order Value': 2300.50, order_id: 'ORD002' },
        { order_number: 'SW003', 'Order Value': 899.99, order_id: 'ORD003' },
        { order_number: 'SW004', 'Order Value': 3200.00, order_id: 'ORD004' },
        { order_number: 'SW005', 'Order Value': 750.25, order_id: 'ORD005' }
      ]
      
      const { data: insertData, error: insertError } = await supabase
        .from('shipway')
        .upsert(sampleData, { onConflict: 'order_id' })
        .select()
      
      if (insertError) {
        console.error('❌ Error inserting sample data:', insertError)
      } else {
        console.log('✅ Sample data ready!')
        console.log(`📊 Total records: ${insertData?.length || 0}`)
      }
      
      return true
    }
  } catch (err) {
    console.error('❌ Script error:', err)
    return false
  }
}

setupShipwayTable().then(success => {
  if (success) {
    console.log('\n🎉 Setup complete! Your shipway table is ready.')
    console.log('🌐 Check your application: http://localhost:3000')
  } else {
    console.log('\n⚠️  Manual setup required. Please follow the instructions above.')
  }
})