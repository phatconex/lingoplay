
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY)

async function checkSchema() {
  const { data, error } = await supabase.from('vocabulary_sets').select('*').limit(1)
  if (error) {
    console.error(error)
  } else {
    console.log('Columns in vocabulary_sets:', Object.keys(data[0] || {}))
  }
}

checkSchema()
