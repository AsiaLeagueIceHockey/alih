const cheerio = require('cheerio');
const fs = require('fs');

const targetSeason = process.argv[2];
const outputPath = process.argv[3];

if (!/^\d{4}-\d{2}$/.test(targetSeason || '') || !outputPath) {
  console.error('Usage: node scripts/generate_schedule_sql.cjs <YYYY-YY> <output-sql-path>');
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
  'ダイドードリンコアイスアリーナ':             'Hachinohe',  // Freeblades secondary home
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
          // Normalize to English place name used in our DB
          matchPlace = VENUE_MAP[matchPlace] || matchPlace;

          if (homeTeamId && awayTeamId && time) {
            const matchAt = `${fullDate} ${time}:00+09`;
            games.push({
              match_at: matchAt,
              match_place: matchPlace,
              home_alih_team_id: homeTeamId,
              away_alih_team_id: awayTeamId,
              game_status: 'Scheduled',
              season: targetSeason,
              season_phase: 'regular'
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

  let sql = `-- Schedule seed for ${targetSeason}\n`;
  sql += `-- Auto-generated from asiaicehockey.com\n\n`;

  // 1. Delete existing just in case
  sql += `-- Initial season scaffold only. Do not run this replacement after results or standings exist.\n`;
  sql += `DELETE FROM alih_schedule WHERE season = '${targetSeason}';\n`;
  sql += `DELETE FROM alih_standings WHERE season = '${targetSeason}';\n\n`;

  // 2. Insert Standings
  sql += `INSERT INTO alih_standings (season, team_id, rank, games_played, points, win_60min, win_ot, win_pss, lose_pss, lose_ot, lose_60min, goals_for, goals_against)\nVALUES\n`;

  const standingsVals = Object.values(TEAM_MAP).map(id => `('${targetSeason}', ${id}, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)`);
  sql += standingsVals.join(',\n') + ';\n\n';

  // 3. Insert Schedule
  sql += `INSERT INTO alih_schedule (game_no, match_at, match_place, home_alih_team_id, away_alih_team_id, game_status, season, season_phase)\nVALUES\n`;

  const scheduleVals = allGames.map((g, i) => {
    return `(${i + 1}, '${g.match_at}', '${g.match_place.replace(/'/g, "''")}', ${g.home_alih_team_id}, ${g.away_alih_team_id}, '${g.game_status}', '${g.season}', '${g.season_phase}')`;
  });

  sql += scheduleVals.join(',\n') + ';\n';

  fs.writeFileSync(outputPath, sql);
  console.log(`Successfully generated ${outputPath}`);
}

main();
