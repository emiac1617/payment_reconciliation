const { createClient } = require('@supabase/supabase-js')

// Hardcode the values from .env.local for this script
const supabaseUrl = 'https://recon.emiactech.com/'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlLWRlbW8iLCJpYXQiOjE3NTIzMDEwMzUsImV4cCI6MjA2NzY2MTAzNX0.n35bpBqTwJsnRZmfney0909gtAc5SPBH7kekrDFSikY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertSampleData() {
  try {
    console.log('Inserting sample data into shipway table...')
    
    const sampleData = [
      {
        order_number: 'SW001',
        'Order Value': 1500.00,
        order_id: 'ORD001'
      },
      {
        order_number: 'SW002', 
        'Order Value': 2300.50,
        order_id: 'ORD002'
      },
      {
        order_number: 'SW003',
        'Order Value': 899.99,
        order_id: 'ORD003'
      },
      {
        order_number: 'SW004',
        'Order Value': 3200.00,
        order_id: 'ORD004'
      },
      {
        order_number: 'SW005',
        'Order Value': 750.25,
        order_id: 'ORD005'
      }
    ]
    
    const { data, error } = await supabase
      .from('shipway')
      .insert(sampleData)
      .select()
    
    if (error) {
      console.error('❌ Error inserting data:', error)
      if (error.code === '42P01') {
        console.log('\n⚠️  Table does not exist. Please create the shipway table first!')
        console.log('Run: node scripts/create-shipway-table.js')
      }
    } else {
      console.log('✅ Sample data inserted successfully!')
      console.log(`📊 Inserted ${data.length} records`)
      console.log('Sample records:', data)
    }
  } catch (err) {
    console.error('❌ Script error:', err)
  }
}

insertSampleData()