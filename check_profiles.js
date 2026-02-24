
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*')
    if (error) {
        console.error('Error fetching profiles:', error)
        return
    }
    console.log('Profiles found:', data.length)
    data.forEach(p => {
        console.log(`- ID: ${p.id}, Name: ${p.musician_name}, Show ID: ${p.current_show_id}`)
    })
}

checkProfiles()
