const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const EPISODE_FILE = path.join(__dirname, '../src/episodeData.js');

// Extract episode data from the JS file
function loadEpisodes() {
    const content = fs.readFileSync(EPISODE_FILE, 'utf-8');
    const match = content.match(/export const EPISODE_DB = (\[[\s\S]*\]);/);
    if (!match) {
        throw new Error('Could not parse episodeData.js');
    }
    return JSON.parse(match[1]);
}

// Format date to "MMM YYYY" format
function formatDate(isoDate) {
    const date = new Date(isoDate);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Fetch publish date from YouTube video page
async function fetchYouTubeDate(page, videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);

        const datePublished = await page.evaluate(() => {
            const metaDate = document.querySelector('meta[itemprop="datePublished"]');
            if (metaDate) return metaDate.getAttribute('content');

            const scripts = document.querySelectorAll('script[type="application/ld+json"]');
            for (const script of scripts) {
                try {
                    const data = JSON.parse(script.textContent);
                    if (data.datePublished) return data.datePublished;
                    if (data.uploadDate) return data.uploadDate;
                } catch (e) {}
            }
            return null;
        });

        if (datePublished && datePublished.match(/^\d{4}-\d{2}-\d{2}/)) {
            return formatDate(datePublished);
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function main() {
    const sampleSize = parseInt(process.argv[2]) || 10;

    console.log('🔍 Date Verification Tool');
    console.log('=========================\n');

    const episodes = loadEpisodes();

    // Select random sample of episodes
    const shuffled = episodes.sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, sampleSize);

    console.log(`📊 Verifying ${sampleSize} random episodes...\n`);

    const browser = await chromium.launch({
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    let matchCount = 0;
    let mismatchCount = 0;
    let errorCount = 0;
    const mismatches = [];

    for (let i = 0; i < sample.length; i++) {
        const episode = sample[i];
        console.log(`[${i + 1}/${sampleSize}] EP.${episode.id}: ${episode.title.substring(0, 50)}...`);
        console.log(`  Website date: ${episode.date}`);

        const youtubeDate = await fetchYouTubeDate(page, episode.youtubeId);

        if (youtubeDate) {
            console.log(`  YouTube date: ${youtubeDate}`);

            if (episode.date === youtubeDate) {
                console.log(`  ✅ MATCH\n`);
                matchCount++;
            } else {
                console.log(`  ❌ MISMATCH\n`);
                mismatchCount++;
                mismatches.push({
                    id: episode.id,
                    title: episode.title,
                    websiteDate: episode.date,
                    youtubeDate: youtubeDate,
                    youtubeId: episode.youtubeId
                });
            }
        } else {
            console.log(`  ⚠️  Could not fetch YouTube date\n`);
            errorCount++;
        }

        // Rate limiting
        if (i < sample.length - 1) {
            await page.waitForTimeout(2000);
        }
    }

    await browser.close();

    console.log('=========================');
    console.log('📊 Verification Results:');
    console.log(`  ✅ Matches: ${matchCount}`);
    console.log(`  ❌ Mismatches: ${mismatchCount}`);
    console.log(`  ⚠️  Errors: ${errorCount}`);

    if (mismatches.length > 0) {
        console.log('\n❌ Mismatched Episodes:');
        mismatches.forEach(m => {
            console.log(`  EP.${m.id}: Website="${m.websiteDate}" vs YouTube="${m.youtubeDate}"`);
            console.log(`    https://www.youtube.com/watch?v=${m.youtubeId}`);
        });
    }

    const accuracy = ((matchCount / (matchCount + mismatchCount)) * 100).toFixed(1);
    console.log(`\n📈 Accuracy: ${accuracy}%`);

    if (mismatchCount === 0 && errorCount === 0) {
        console.log('\n🎉 All dates verified successfully!');
    }
}

main().catch(console.error);
