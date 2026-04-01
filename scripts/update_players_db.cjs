const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const manualMappings = {
    "SOHMA,Shuto": "Shuto Souma",
    "LEE, Kento": "Kent Lee",
    "TANEICHI,Yuto": "Yuta Taneichi",
    "AYRE,Kaisei": "Trevor Ayre"
};

// Normalize name for aggressive matching (Character-level sorting)
function normalizeName(name) {
    if (!name) return "";
    
    // Remove (G), (D), (F), (C/LW) etc
    let cleanName = name.replace(/\s*\([^)]+\)\s*$/, "");
    
    // Remove # numbers
    cleanName = cleanName.replace(/#\d+\s*/, "");
    
    // Convert to lowercase, remove all non-alphanumeric and 'h'
    cleanName = cleanName.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/h/g, "");
    
    // Sort characters to handle 'In Gyo' vs 'Ingyo' and Last/First order differences
    return cleanName.split("").sort().join("");
}

async function updateDatabase() {
    const dataPath = path.join(__dirname, '../data/scraped_ep_players.json');
    if (!fs.existsSync(dataPath)) {
        console.error("Scraped data not found:", dataPath);
        return;
    }

    const scrapedPlayers = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`Loaded ${scrapedPlayers.length} scraped players.`);

    // Fetch players that need career history
    const { data: dbPlayers, error } = await supabase
        .from('alih_players')
        .select('id, name, name_en, team_id')
        .is('career_history', null);

    if (error) {
        console.error("Error fetching database players:", error);
        return;
    }

    console.log(`Found ${dbPlayers.length} players in the database missing career history.`);

    let updatedCount = 0;
    const unmatched = [];

    for (const p of dbPlayers) {
        // 1. Try manual mapping first
        let epPlayer = null;
        const manualEPName = manualMappings[p.name] || manualMappings[p.name_en];
        if (manualEPName) {
            epPlayer = scrapedPlayers.find(ep => ep.name.includes(manualEPName));
        }

        // 2. Fallback to automated fuzzy matching
        if (!epPlayer) {
            const normDBName = normalizeName(p.name);
            const normDBNameEn = normalizeName(p.name_en);
            
            epPlayer = scrapedPlayers.find(ep => {
                const normEP = normalizeName(ep.name);
                return (normDBNameEn && normEP === normDBNameEn) || (normDBName && normEP === normDBName);
            });
        }

        if (epPlayer) {
            console.log(`Matched: ${p.name || p.name_en} -> EP: ${epPlayer.name} (DB ID: ${p.id})`);
            
            const updates = {};
            if (epPlayer.facts) {
                if (epPlayer.facts.birth_date) {
                    let bdate = epPlayer.facts.birth_date.substring(0, 10);
                    // Handle 2002-00-00 style dates which cause SQL errors
                    bdate = bdate.replace(/-00/g, "-01");
                    updates.birth_date = bdate;
                }
                if (epPlayer.facts.height_cm) updates.height_cm = epPlayer.facts.height_cm;
                if (epPlayer.facts.weight_kg) updates.weight_kg = epPlayer.facts.weight_kg;
                if (epPlayer.facts.nationality) updates.nationality = epPlayer.facts.nationality;
            }

            if (epPlayer.career_history) {
                updates.career_history = epPlayer.career_history;
            }

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('alih_players')
                    .update(updates)
                    .eq('id', p.id);

                if (updateError) {
                    console.error(`Error updating player ${p.id}:`, updateError);
                } else {
                    updatedCount++;
                }
            }
        } else {
            unmatched.push(p);
        }
    }

    console.log(`\nSynchronization Summary:`);
    console.log(`- Players checked: ${dbPlayers.length}`);
    console.log(`- Successfully matched and updated: ${updatedCount}`);
    
    if (unmatched.length > 0) {
        console.log(`\nRemaining Unmatched Players (${unmatched.length}):`);
        unmatched.forEach(u => {
            console.log(`${u.id}: ${u.name || u.name_en} (Team: ${u.team_id})`);
        });
        
        // Write unmatched to a file for review
        fs.writeFileSync(path.join(__dirname, '../data/unmatched_players.json'), JSON.stringify(unmatched, null, 2));
    }
}

updateDatabase();
