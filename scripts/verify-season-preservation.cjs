const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const datasets = [
  { name: 'schedule_2025_26', table: 'alih_schedule', filter: (query) => query.eq('season', '2025-26') },
  { name: 'game_details', table: 'alih_game_details', filter: (query) => query },
  { name: 'players_2025_26', table: 'alih_players', filter: (query) => query.eq('season', '2025-26') },
  { name: 'standings_2025_26', table: 'alih_standings', filter: (query) => query.eq('season', '2025-26') },
  { name: 'cheers', table: 'alih_cheers', filter: (query) => query },
];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and a read-capable SUPABASE_SERVICE_KEY or SUPABASE_KEY are required');
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const result = {};
  for (const dataset of datasets) {
    const query = dataset.filter(supabase.from(dataset.table).select('*').order('id'));
    const { data, error } = await query;
    if (error) throw new Error(`${dataset.name}: ${error.message}`);
    result[dataset.name] = {
      rows: data.length,
      sha256: crypto.createHash('sha256').update(JSON.stringify(canonicalize(data))).digest('hex'),
    };
  }
  console.log(JSON.stringify(result));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
