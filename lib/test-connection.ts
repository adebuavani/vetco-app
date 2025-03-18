import { supabase } from './supabase'

async function testConnection() {
  console.log('Testing Supabase connection...')
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  
  try {
    // First, check if we can connect to Supabase at all
    const { data: versionData, error: versionError } = await supabase.rpc('version')
    
    if (versionError) {
      console.error('❌ Failed to connect to Supabase:', versionError.message)
      return
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log('PostgreSQL version:', versionData)
    
    // Now try to query a table
    console.log('Attempting to query the animals table...')
    const { data, error } = await supabase.from('animals').select('*').limit(1)
    
    if (error) {
      if (error.code === '42P01') {
        console.error('❌ Table "animals" does not exist yet. You need to create it first.')
      } else {
        console.error('❌ Error querying animals table:', error.message)
      }
      return
    }
    
    console.log('✅ Successfully queried the animals table!')
    console.log('Query result:', data)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the test
testConnection()