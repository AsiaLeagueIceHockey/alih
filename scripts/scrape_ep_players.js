const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 50);
        });
    });
}

async function scrapePlayerProfile(browser, url) {
    const page = await browser.newPage();
    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        // Wait a bit for NEXT_DATA to be available
        await page.waitForSelector('#__NEXT_DATA__', { timeout: 10000 });

        const data = await page.evaluate(() => {
            const result = { facts: {}, career_history: [] };
            try {
                const nextDataScript = document.getElementById('__NEXT_DATA__');
                if (nextDataScript) {
                    const nextData = JSON.parse(nextDataScript.textContent);
                    const pageProps = nextData.props?.pageProps;
                    if (pageProps) {
                        const player = pageProps.playerData?.player || pageProps.pageData?.player;
                        if (player) {
                            result.facts.birth_date = player.dateOfBirth || null;
                            if (player.nationality && player.nationality.name) result.facts.nationality = player.nationality.name;
                            if (player.height && player.height.metrics) result.facts.height_cm = player.height.metrics;
                            if (player.weight && player.weight.metrics) result.facts.weight_kg = player.weight.metrics;

                            const stats = player.stats || player.regularSeasonStats;
                            if (stats && Array.isArray(stats)) {
                                result.career_history = stats.map(s => ({
                                    season: s.season ? s.season.slug : '',
                                    team: s.team ? s.team.name : '',
                                    league: s.league ? (s.league.name || s.league.slug) : '',
                                    gp: parseInt(s.gp) || 0,
                                    g: parseInt(s.g) || 0,
                                    a: parseInt(s.a) || 0,
                                    tp: parseInt(s.tp || s.pts) || 0,
                                    pim: parseInt(s.pim) || 0
                                })).filter(s => s.season && s.team);
                            }
                        }
                    }
                }
            } catch (e) {
                console.error("Extraction error:", e.message);
            }
            return result;
        });

        await page.close();
        return data;
    } catch (e) {
        console.error(`Error scraping ${url}:`, e.message);
        await page.close();
        return null;
    }
}

async function getPlayerLinks(browser, rosterUrl) {
    const page = await browser.newPage();
    await page.goto(rosterUrl, { waitUntil: 'networkidle2' });
    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href*="/player/"]'))
            .map(a => a.href)
            .filter(href => !href.includes('/stats') && !href.includes('/transfers'));
    });
    await page.close();
    return [...new Set(links)];
}

const teams = [
    { name: "HL Anyang", url: "https://www.eliteprospects.com/team/1497/hl-anyang" },
    { name: "Red Eagles Hokkaido", url: "https://www.eliteprospects.com/team/427/red-eagles-hokkaido" },
    { name: "Tohoku Free Blades", url: "https://www.eliteprospects.com/team/4485/tohoku-free-blades" },
    { name: "Nikko Icebucks", url: "https://www.eliteprospects.com/team/426/nikko-icebucks" },
    { name: "Stars Kobe", url: "https://www.eliteprospects.com/team/44472/stars-kobe" },
    { name: "Yokohama Grits", url: "https://www.eliteprospects.com/team/30912/yokohama-grits" }
];

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    const dataPath = path.join(dataDir, 'scraped_ep_players.json');

    let allScrapedPlayers = [];
    if (fs.existsSync(dataPath)) {
        allScrapedPlayers = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    }

    const seenUrls = new Set(allScrapedPlayers.map(p => p.url));

    for (const team of teams) {
        console.log(`Processing team: ${team.name}`);
        const links = await getPlayerLinks(browser, team.url);
        console.log(`Found ${links.length} players for ${team.name}`);

        for (const link of links) {
            if (seenUrls.has(link)) continue;

            console.log(`Scraping: ${link}`);
            const data = await scrapePlayerProfile(browser, link);
            if (data) {
                const playerName = link.split('/').pop().replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                const playerRecord = {
                    name: playerName,
                    url: link,
                    team: team.name,
                    ...data
                };
                allScrapedPlayers.push(playerRecord);
                fs.writeFileSync(dataPath, JSON.stringify(allScrapedPlayers, null, 2));
                seenUrls.add(link);
            }
            // Small delay to be polite
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    await browser.close();
    console.log("Scraping completed.");
})();
