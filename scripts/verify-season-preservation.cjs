const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const datasets = [
  { name: 'schedule_2025_26', table: 'alih_schedule', filter: (query) => query.eq('season', '2025-26') },
  { name: 'players_2025_26', table: 'alih_players', filter: (query) => query.eq('season', '2025-26') },
  { name: 'standings_2025_26', table: 'alih_standings', filter: (query) => query.eq('season', '2025-26') },
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
  const { data: schedules, error: schedulesError } = await supabase
    .from('alih_schedule')
    .select('id')
    .eq('season', '2025-26')
    .order('id');
  if (schedulesError) throw new Error(`schedule_2025_26: ${schedulesError.message}`);
  const scheduleIds = schedules.map((schedule) => schedule.id);

  for (const dataset of datasets) {
    const query = dataset.filter(supabase.from(dataset.table).select('*').order('id'));
    const { data, error } = await query;
    if (error) throw new Error(`${dataset.name}: ${error.message}`);
    result[dataset.name] = {
      rows: data.length,
      sha256: crypto.createHash('sha256').update(JSON.stringify(canonicalize(data))).digest('hex'),
    };
  }
  for (const dataset of [
    { name: 'game_details_2025_26', table: 'alih_game_details' },
    { name: 'cheers_2025_26', table: 'alih_cheers' },
  ]) {
    const { data, error } = await supabase
      .from(dataset.table)
      .select('*')
      .in('schedule_id', scheduleIds)
      .order('id');
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
