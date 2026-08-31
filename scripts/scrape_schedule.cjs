const cheerio = require('cheerio');

const targetSeason = process.argv[2] || '2026-27';

if (!/^\d{4}-\d{2}$/.test(targetSeason)) {
  console.error('Usage: node scripts/scrape_schedule.cjs [YYYY-YY]');
  process.exit(1);
}

const seasonStartYear = Number(targetSeason.slice(0, 4));

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
  console.log(`Fetching ${url}...`);
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    let currentDate = '';
    const games = [];

    // Parse the schedule
    // The structure is generally:
    // <h5>MM月DD日（Day）</h5>
    // <div class="uk-child-width-1-2@m uk-grid-match" uk-grid>
    //   <div><table class="alh-table schedule">...</table></div>
    // </div>

    // We will iterate through children of the container that holds the schedule
    // Actually, we can just find all h5 tags and their next sibling divs
    $('h5').each((i, el) => {
      const dateText = $(el).text().trim();
      // Parse date: e.g. "09月12日（土）" -> "09-12"
      const match = dateText.match(/(\d+)月(\d+)日/);
      if (!match) return;
      const monthStr = match[1].padStart(2, '0');
      const dayStr = match[2].padStart(2, '0');
      // Year is from the URL
      const fullDate = `${year}-${monthStr}-${dayStr}`;

      const gridDiv = $(el).next('div.uk-grid-match');
      if (gridDiv.length) {
        gridDiv.find('table.alh-table.schedule').each((j, tableEl) => {
          const $table = $(tableEl);
          const time = $table.find('tbody tr:nth-child(1) td:nth-child(1)').text().trim();

          let homeTeamName = $table.find('tbody tr:nth-child(1) td:nth-child(2)').text().trim();
          let awayTeamName = $table.find('tbody tr:nth-child(2) td:nth-child(1)').text().trim();

          // Remove potential img tags text if any, but .text() just gets text content
          homeTeamName = homeTeamName.replace(/^\s+|\s+$/g, '');
          awayTeamName = awayTeamName.replace(/^\s+|\s+$/g, '');

          const homeTeamId = TEAM_MAP[homeTeamName];
          const awayTeamId = TEAM_MAP[awayTeamName];

          let matchPlace = $table.find('tbody tr:nth-child(4) td:nth-child(2)').text().trim();
          if (!matchPlace) {
             matchPlace = $table.find('tbody tr:nth-child(3) td:nth-child(2)').text().trim();
          }

          if (homeTeamId && awayTeamId && time) {
            // Construct timestamp (JST = +09:00)
            const matchAt = `${fullDate}T${time}:00+09:00`;
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

  console.log(`Found ${allGames.length} games.`);

  if (allGames.length > 0) {
    // assign game_no (since source_game_no might be hard to get reliably without clicking detail)
    allGames = allGames.sort((a, b) => new Date(a.match_at) - new Date(b.match_at));
    allGames = allGames.map((g, i) => ({ ...g, game_no: i + 1 }));

    console.log(JSON.stringify(allGames, null, 2));
    console.log('No database writes were performed. Review the output and generate a versioned SQL migration before applying it.');
  }
}

main();
