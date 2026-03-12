const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeProfile(url) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#__NEXT_DATA__', { timeout: 10000 });
        const data = await page.evaluate(() => {
            const nextDataScript = document.getElementById('__NEXT_DATA__');
            if (!nextDataScript) return null;
            const nextData = JSON.parse(nextDataScript.textContent);
            const player = nextData.props?.pageProps?.playerData?.player;
            if (!player) return null;
            return {
                name: player.name,
                facts: {
                    birth_date: player.dateOfBirth,
                    nationality: player.nationality?.name,
                    height_cm: player.height?.metrics,
                    weight_kg: player.weight?.metrics
                },
                career_history: (player.stats || []).map(s => ({
                    season: s.season?.slug,
                    team: s.team?.name,
                    league: s.league?.name || s.league?.slug,
                    gp: parseInt(s.gp) || 0,
                    g: parseInt(s.g) || 0,
                    a: parseInt(s.a) || 0,
                    tp: parseInt(s.tp || s.pts) || 0,
                    pim: parseInt(s.pim) || 0
                })).filter(s => s.season && s.team)
            };
        });
        await browser.close();
        return data;
    } catch (e) {
        console.error(e);
        await browser.close();
        return null;
    }
}

(async () => {
    const url = 'https://www.eliteprospects.com/player/700858/kaisei-ayre';
    const data = await scrapeProfile(url);
    if (data) {
        data.url = url;
        data.team = 'STARS';
        const currentData = JSON.parse(fs.readFileSync('data/scraped_ep_players.json', 'utf8'));
        currentData.push(data);
        fs.writeFileSync('data/scraped_ep_players.json', JSON.stringify(currentData, null, 2));
        console.log("Scraped Kaisei Ayre");
    }
})();
