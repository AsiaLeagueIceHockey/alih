const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const teams = [
    { name: "HL Anyang", url: "https://www.eliteprospects.com/team/1497/hl-anyang" },
    { name: "Red Eagles Hokkaido", url: "https://www.eliteprospects.com/team/427/red-eagles-hokkaido" },
    { name: "Tohoku Free Blades", url: "https://www.eliteprospects.com/team/4485/tohoku-free-blades" },
    { name: "Nikko Icebucks", url: "https://www.eliteprospects.com/team/426/nikko-icebucks" },
    { name: "Stars Kobe", url: "https://www.eliteprospects.com/team/44472/stars-kobe" },
    { name: "Yokohama Grits", url: "https://www.eliteprospects.com/team/30912/yokohama-grits" }
];

async function fetchHtml(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });
    return await res.text();
}

async function run() {
    const allPlayers = [];

    // 1. Fetch Rosters
    for (const teamInfo of teams) {
        console.log(`Fetching ${teamInfo.name} Roster...`);
        const html = await fetchHtml(teamInfo.url);
        const $ = cheerio.load(html);
        
        const playerLinks = [];
        const formatUrl = (href) => href.startsWith('http') ? href : 'https://www.eliteprospects.com' + href;

        $('table.roster tbody tr').each((_, row) => {
            const a = $(row).find('.name a, td.player a');
            if (a.length && a.attr('href') && a.attr('href').includes('/player/')) {
                playerLinks.push({
                    name: a.text().trim(),
                    url: formatUrl(a.attr('href')),
                    team: teamInfo.name
                });
            }
        });

        if (playerLinks.length === 0) {
            $('a').each((_, a) => {
                const href = $(a).attr('href');
                if (href && href.includes('/player/')) {
                    playerLinks.push({
                        name: $(a).text().trim(),
                        url: formatUrl(href),
                        team: teamInfo.name
                    });
                }
            });
        }
        allPlayers.push(...playerLinks);
    }

    // Deduplicate
    const uniqueLinks = [];
    const seenUrls = new Set();
    allPlayers.forEach(p => {
        if (!seenUrls.has(p.url) && p.name && p.name.length > 2 && !p.name.includes('\n')) {
            seenUrls.add(p.url);
            uniqueLinks.push(p);
        }
    });
    
    console.log(`Found ${uniqueLinks.length} unique players. Scraping profiles concurrently...`);

    const scrapedPlayers = [];
    const concurrency = 15;
    
    for (let i = 0; i < uniqueLinks.length; i += concurrency) {
        const batch = uniqueLinks.slice(i, i + concurrency);
        console.log(`Processing batch ${i/concurrency + 1}/${Math.ceil(uniqueLinks.length/concurrency)}...`);
        
        await Promise.all(batch.map(async player => {
            try {
                const html = await fetchHtml(player.url);
                const $ = cheerio.load(html);
                const data = { facts: {}, career_history: [] };

                // Facts
                try {
                    const script = $('#__NEXT_DATA__').html();
                    if (script) {
                        const nextData = JSON.parse(script);
                        const playerData = nextData.props.pageProps.pageData.playerData.player;
                        if (playerData) {
                            data.facts.birth_date = playerData.dateOfBirth || null;
                            if (playerData.nationality) data.facts.nationality = playerData.nationality.name;
                            if (playerData.height) data.facts.height_cm = playerData.height.metrics;
                            if (playerData.weight) data.facts.weight_kg = playerData.weight.metrics;
                        }
                    }
                } catch(e) {}

                // Stats Table
                let statsTable = null;
                let headerMap = {};
                
                $('table').each((_, table) => {
                    const headers = $(table).find('thead th');
                    if (headers.length === 0) return;
                    
                    const headerTexts = headers.map((_, th) => $(th).text().trim().toLowerCase()).get();
                    
                    if ((headerTexts.includes('s') || headerTexts.includes('season')) && 
                        headerTexts.includes('team') && headerTexts.includes('league') && headerTexts.includes('gp')) {
                        statsTable = table;
                        headerTexts.forEach((text, index) => {
                            if (text === 's' || text === 'season') headerMap['season'] = index;
                            else if (text === 'team') headerMap['team'] = index;
                            else if (text === 'league') headerMap['league'] = index;
                            else if (text === 'gp') headerMap['gp'] = index;
                            else if (text === 'g') headerMap['g'] = index;
                            else if (text === 'a') headerMap['a'] = index;
                            else if (text === 'tp' || text === 'pts') headerMap['pts'] = index;
                            else if (text === 'pim') headerMap['pim'] = index;
                            else if (text === '+/-') headerMap['plus_minus'] = index;
                            else if (text === 'gaa') headerMap['gaa'] = index;
                            else if (text === 'sv%') headerMap['sv_pct'] = index;
                        });
                    }
                });

                if (statsTable) {
                    const isGoalie = headerMap['gaa'] !== undefined;
                    
                    $(statsTable).find('tbody tr').each((_, row) => {
                        const cells = $(row).find('td');
                        if (cells.length < 5) return;
                        
                        const getText = (index) => {
                            if (index === undefined) return '';
                            const cell = $(cells[index]);
                            const link = cell.find('a');
                            return link.length ? link.text().trim() : cell.text().trim();
                        };

                        const season = getText(headerMap['season']);
                        const team = getText(headerMap['team']);
                        const league = getText(headerMap['league']);
                        
                        if (!season || !team || !league) return;
                        if (season.toLowerCase().includes('total') || team.toLowerCase().includes('totals')) return;

                        const stats = { season, team, league };
                        const getNum = (idx) => {
                            const val = getText(idx);
                            return val && val !== '-' ? parseFloat(val) : 0;
                        };

                        if (isGoalie) {
                            stats.gp = getNum(headerMap['gp']);
                            stats.gaa = getNum(headerMap['gaa']);
                            stats.sv_pct = getText(headerMap['sv_pct']);
                        } else {
                            stats.gp = getNum(headerMap['gp']);
                            stats.g = getNum(headerMap['g']);
                            stats.a = getNum(headerMap['a']);
                            stats.pts = getNum(headerMap['pts']);
                            stats.pim = getNum(headerMap['pim']);
                            stats.plus_minus = getNum(headerMap['plus_minus']);
                        }
                        data.career_history.push(stats);
                    });
                }

                data.career_history = data.career_history.filter(h => h.team && h.team !== '-');

                scrapedPlayers.push({ name: player.name, url: player.url, team: player.team, ...data });
            } catch (e) {
                console.error(`Error scraping ${player.name}:`, e.message);
            }
        }));
    }
    
    const dataPath = path.join(__dirname, '../data');
    if (!fs.existsSync(dataPath)) fs.mkdirSync(dataPath);
    fs.writeFileSync(path.join(dataPath, 'scraped_ep_players.json'), JSON.stringify(scrapedPlayers, null, 2));
    console.log(`Finished scraping ${scrapedPlayers.length} players to data/scraped_ep_players.json`);
}

run();
