const { createClient } = require('@supabase/supabase-js')

// Hardcode the values from .env.local for this script
const supabaseUrl = 'https://recon.emiactech.com/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createShipwayTable() {
  try {
    console.log('Checking if shipway table exists...')
    
    // Try to query the shipway table
    const { data, error } = await supabase
      .from('shipway')
      .select('*')
      .limit(1)
    
    if (error && error.code === '42P01') {
      console.log('\n❌ Shipway table does not exist!')
      console.log('\n📋 Please execute this SQL in your Supabase SQL editor:')
      console.log('\n' + '='.repeat(60))
      console.log(`CREATE TABLE IF NOT EXISTS shipway (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_number VARCHAR(255),
  "Order Value" NUMERIC(10,2),
  order_id VARCHAR(50) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipway_order_id ON shipway(order_id);
CREATE INDEX IF NOT EXISTS idx_shipway_created_at ON shipway(created_at);`)
      console.log('='.repeat(60))
      console.log('\n🔗 Go to: https://recon.emiactech.com/project/default/sql')
    } else if (error) {
      console.error('❌ Other error:', error)
    } else {
      console.log('✅ Shipway table already exists!')
      console.log(`📊 Current records: ${data?.length || 0}`)
    }
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

createShipwayTable()