const cheerio = require('cheerio');
const fs = require('fs');

const targetSeason = process.argv[2];
const outputPath = process.argv[3];
const mode = process.argv[4] || '--reconcile';

if (!/^\d{4}-\d{2}$/.test(targetSeason || '') || !outputPath || !['--reconcile', '--initial-scaffold'].includes(mode)) {
  console.error('Usage: node scripts/generate_schedule_sql.cjs <YYYY-YY> <output-sql-path> [--reconcile|--initial-scaffold]');
  process.exit(1);
}

const seasonStartYear = Number(targetSeason.slice(0, 4));

// Maps Japanese venue names from asiaicehockey.com → English place names used in our DB
const VENUE_MAP = {
  'nepiaアイスアリーナ':                      'Tomakomai',
  'HLアニャンアイスリンク':                    'Anyang',
  '日光霧降アイスアリーナ':                    'Nikko',
  'FLAT HACHINOHE':                           'Hachinohe',
  'KOSÉ新横浜スケートセンター':               'Shinyokohama',
  '月寒体育館':                               'Sapporo',
  '尼崎スポーツの森 アイススケートリンク':      'Amagasaki',
  '尼崎スポーツの森\u3000アイススケートリンク': 'Amagasaki', // full-width space variant
  '神戸市立ポートアイランドスポーツセンター':   'Kobe',
  'ダイドードリンコアイスアリーナ':             'Nishitokyo',
  'ユタカアイスアリーナくしろ':                'Kushiro',
  '小瀬スポーツ公園アイスアリーナ':            'Kofu',
};

const TEAM_MAP = {
  'レッドイーグルス北海道': 2,
  'H.C.栃木日光アイスバックス': 5,
  '横浜GRITS': 4,
  'スターズ神戸': 6,
  'HLアニャンアイスホッケークラブ': 1,
  '東北フリーブレイズ': 3
};

async function scrapeMonth(year, month) {
  const url = `https://asiaicehockey.com/schedule/${year}/${month.toString().padStart(2, '0')}`;
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const games = [];

    $('h5').each((i, el) => {
      const dateText = $(el).text().trim();
      const match = dateText.match(/(\d+)月(\d+)日/);
      if (!match) return;
      const monthStr = match[1].padStart(2, '0');
      const dayStr = match[2].padStart(2, '0');
      const fullDate = `${year}-${monthStr}-${dayStr}`;

      const gridDiv = $(el).next('div.uk-grid-match');
      if (gridDiv.length) {
        gridDiv.find('table.alh-table.schedule').each((j, tableEl) => {
          const $table = $(tableEl);
          const time = $table.find('tbody tr:nth-child(1) td:nth-child(1)').text().trim();
          let homeTeamName = $table.find('tbody tr:nth-child(1) td:nth-child(2)').text().trim();
          let awayTeamName = $table.find('tbody tr:nth-child(2) td:nth-child(1)').text().trim();
          homeTeamName = homeTeamName.replace(/^\s+|\s+$/g, '');
          awayTeamName = awayTeamName.replace(/^\s+|\s+$/g, '');

          const homeTeamId = TEAM_MAP[homeTeamName];
          const awayTeamId = TEAM_MAP[awayTeamName];

          let matchPlace = $table.find('tbody tr:nth-child(4) td:nth-child(2)').text().trim();
          if (!matchPlace) {
             matchPlace = $table.find('tbody tr:nth-child(3) td:nth-child(2)').text().trim();
          }
          const scoreHref = $table.closest('a').attr('href') || '';
          const scoreIdMatch = scoreHref.match(/\/score\/(\d+)/);
          const sourceScoreId = scoreIdMatch ? Number(scoreIdMatch[1]) : null;
          // Normalize to English place name used in our DB
          matchPlace = VENUE_MAP[matchPlace] || matchPlace;

          if (homeTeamId && awayTeamId && time && sourceScoreId) {
            const matchAt = `${fullDate} ${time}:00+09`;
            games.push({
              match_at: matchAt,
              match_place: matchPlace,
              home_alih_team_id: homeTeamId,
              away_alih_team_id: awayTeamId,
              game_status: 'Scheduled',
              season: targetSeason,
              season_phase: 'regular',
              score_url: `https://asiaicehockey.com/score/${sourceScoreId}`
            });
          }
        });
      }
    });
    return games;
  } catch (err) {
    console.error(`Failed to fetch ${url}`, err);
    return [];
  }
}

async function main() {
  const monthsToScrape = [9, 10, 11, 12].map(month => ({ year: seasonStartYear, month }))
    .concat([1, 2, 3, 4].map(month => ({ year: seasonStartYear + 1, month })));

  let allGames = [];
  for (const m of monthsToScrape) {
    const games = await scrapeMonth(m.year, m.month);
    allGames = allGames.concat(games);
  }

  allGames = allGames.sort((a, b) => new Date(a.match_at) - new Date(b.match_at));

  if (allGames.length !== 120) {
    throw new Error(`Expected 120 regular-season games, received ${allGames.length}. Refusing to generate SQL.`);
  }

  let sql = `-- Schedule seed for ${targetSeason}\n`;
  sql += `-- Auto-generated from asiaicehockey.com\n\n`;

  if (mode === '--reconcile') {
    sql += `-- Additive source reconciliation for an already-created season.\n`;
    sql += `-- Preserves scores, statuses, reminders, highlights, YouTube live URLs, and all historical seasons.\n\n`;
    sql += `ALTER TABLE public.alih_schedule ADD COLUMN IF NOT EXISTS score_url TEXT;\n`;
    sql += `CREATE UNIQUE INDEX IF NOT EXISTS idx_alih_schedule_score_url ON public.alih_schedule (score_url) WHERE score_url IS NOT NULL;\n\n`;
    sql += `DO $$\nBEGIN\n`;
    sql += `  IF (SELECT count(*) FROM public.alih_schedule WHERE season = '${targetSeason}') <> 120\n`;
    sql += `     OR (SELECT count(DISTINCT game_no) FROM public.alih_schedule WHERE season = '${targetSeason}') <> 120\n`;
    sql += `     OR EXISTS (SELECT 1 FROM public.alih_schedule WHERE season = '${targetSeason}' AND game_status IS DISTINCT FROM 'Scheduled') THEN\n`;
    sql += `    RAISE EXCEPTION '${targetSeason} schedule must contain exactly 120 unique, unstarted games';\n`;
    sql += `  END IF;\n`;
    sql += `  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'alih_schedule_season_game_no_key' AND conrelid = 'public.alih_schedule'::regclass) THEN\n`;
    sql += `    ALTER TABLE public.alih_schedule ADD CONSTRAINT alih_schedule_season_game_no_key UNIQUE (season, game_no);\n`;
    sql += `  END IF;\nEND $$;\n\n`;
    sql += `WITH source(match_at, match_place, home_alih_team_id, away_alih_team_id, score_url) AS (\nVALUES\n`;
    sql += allGames.map((g) => {
      const place = g.match_place.replace(/'/g, "''");
      return `('${g.match_at}', '${place}', ${g.home_alih_team_id}, ${g.away_alih_team_id}, '${g.score_url}')`;
    }).join(',\n');
    sql += `\n), matched AS (\n`;
    sql += `  SELECT schedule.id, source.score_url\n`;
    sql += `  FROM source\n`;
    sql += `  JOIN public.alih_schedule AS schedule\n`;
    sql += `    ON schedule.season = '${targetSeason}'\n`;
    sql += `   AND schedule.match_at = source.match_at::timestamptz\n`;
    sql += `   AND schedule.home_alih_team_id = source.home_alih_team_id\n`;
    sql += `   AND schedule.away_alih_team_id = source.away_alih_team_id\n`;
    sql += `), guard AS (\n`;
    sql += `  SELECT count(*) AS match_count, count(DISTINCT id) AS distinct_match_count\n`;
    sql += `  FROM matched\n`;
    sql += `)\n`;
    sql += `UPDATE public.alih_schedule AS schedule\n`;
    sql += `SET score_url = matched.score_url\n`;
    sql += `FROM matched CROSS JOIN guard\n`;
    sql += `WHERE schedule.id = matched.id\n`;
    sql += `  AND guard.match_count = 120\n`;
    sql += `  AND guard.distinct_match_count = 120;\n\n`;
    sql += `\nDO $$\nBEGIN\n`;
    sql += `  IF (SELECT count(*) FROM public.alih_schedule WHERE season = '${targetSeason}' AND score_url IS NOT NULL) <> 120\n`;
    sql += `     OR (SELECT count(DISTINCT score_url) FROM public.alih_schedule WHERE season = '${targetSeason}') <> 120 THEN\n`;
    sql += `    RAISE EXCEPTION '${targetSeason} score_url reconciliation did not map 120 unique games';\n`;
    sql += `  END IF;\nEND $$;\n`;
    fs.writeFileSync(outputPath, sql);
    console.log(`Successfully generated ${outputPath}`);
    return;
  }

  // Initial scaffolding is explicit because it replaces only the selected season.
  sql += `-- Initial season scaffold only. Do not run this replacement after results or standings exist.\n`;
  sql += `DELETE FROM alih_schedule WHERE season = '${targetSeason}';\n`;
  sql += `DELETE FROM alih_standings WHERE season = '${targetSeason}';\n\n`;

  // 2. Insert Standings
  sql += `INSERT INTO alih_standings (season, team_id, rank, games_played, points, win_60min, win_ot, win_pss, lose_pss, lose_ot, lose_60min, goals_for, goals_against)\nVALUES\n`;

  const standingsVals = Object.values(TEAM_MAP).map(id => `('${targetSeason}', ${id}, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`);
  sql += standingsVals.join(',\n') + ';\n\n';

  // 3. Insert Schedule
  sql += `INSERT INTO alih_schedule (game_no, match_at, match_place, home_alih_team_id, away_alih_team_id, game_status, season, season_phase, score_url)\nVALUES\n`;

  const scheduleVals = allGames.map((g, i) => {
    return `(${i + 1}, '${g.match_at}', '${g.match_place.replace(/'/g, "''")}', ${g.home_alih_team_id}, ${g.away_alih_team_id}, '${g.game_status}', '${g.season}', '${g.season_phase}', '${g.score_url}')`;
  });

  sql += scheduleVals.join(',\n') + ';\n';

  fs.writeFileSync(outputPath, sql);
  console.log(`Successfully generated ${outputPath}`);
}

main();
