const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHealth() {
    console.log("Testing Supabase connection at:", supabaseUrl);
    const start = Date.now();
    try {
        const { data, error, status, statusText } = await supabase
            .from('alih_schedule')
            .select('id, game_no, match_at, game_status')
            .limit(5);

        const duration = Date.now() - start;
        console.log(`Status: ${status} (${statusText}) | Duration: ${duration}ms`);
        if (error) {
            console.error("Error response:", JSON.stringify(error, null, 2));
        } else {
            console.log(`Retrieved ${data ? data.length : 0} rows.`);
        }
    } catch (e) {
        console.error("Exception thrown during fetch:", e);
    }
}

testHealth();
