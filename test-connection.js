
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://arlpfhuxbnyexqlzajfs.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybHBmaHV4Ym55ZXhxbHphamZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMjc2NjcsImV4cCI6MjA4MzgwMzY2N30.tWLnmUY-SmEZfMg2UfUxLLP66lko9qSf_KSyt8HcHMQ'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function testConnection() {
  console.log('Testing connection to Supabase...')
  
  // Test 1: Check Auth Config (public)
  console.log('\n1. Testing Public Access...')
  const { data: health, error: healthError } = await supabase.from('leads').select('count', { count: 'exact', head: true })
  
  if (healthError) {
    console.error('❌ Error accessing "leads" table:', healthError.message)
    console.error('Details:', healthError)
  } else {
    console.log('✅ "leads" table is accessible. Count:', health)
  }

  // Test 2: Edge Function
  console.log('\n2. Testing Edge Function (search-leads)...')
  const { data: funcData, error: funcError } = await supabase.functions.invoke('search-leads', {
    body: { query: 'test', limit: 1 }
  })

  if (funcError) {
    console.error('❌ Error invoking function:', funcError.message)
    console.error('Details:', funcError)
  } else {
    console.log('✅ Function invoked successfully:', funcData)
  }
}

testConnection()
