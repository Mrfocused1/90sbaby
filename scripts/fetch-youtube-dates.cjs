const fs = require('fs');
const path = require('path');
const https = require('https');

const EPISODE_FILE = path.join(__dirname, '../src/episodeData.js');
const CACHE_FILE = path.join(__dirname, 'youtube-dates-cache.json');

// Read existing cache if it exists
function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        }
    } catch (e) {
        console.log('No existing cache found, starting fresh.');
    }
    return {};
}

// Save cache after each successful fetch
function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

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

// Fetch page HTML
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

// Extract publish date from YouTube page HTML
function extractDateFromHTML(html) {
    // Method 1: Look for datePublished in meta tag
    let match = html.match(/<meta\s+itemprop="datePublished"\s+content="([^"]+)"/i);
    if (match) return match[1];

    // Method 2: Look for uploadDate in JSON-LD
    match = html.match(/"uploadDate"\s*:\s*"([^"]+)"/);
    if (match) return match[1];

    // Method 3: Look for datePublished in JSON-LD
    match = html.match(/"datePublished"\s*:\s*"([^"]+)"/);
    if (match) return match[1];

    // Method 4: Look for publishDate in ytInitialPlayerResponse
    match = html.match(/"publishDate"\s*:\s*"([^"]+)"/);
    if (match) return match[1];

    return null;
}

// Fetch publish date from YouTube video page
async function fetchVideoDate(videoId, retries = 3) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const html = await fetchPage(url);
            const dateISO = extractDateFromHTML(html);

            if (dateISO && dateISO.match(/^\d{4}-\d{2}-\d{2}/)) {
                return dateISO;
            }

            throw new Error('Date not found in page');

        } catch (error) {
            if (attempt < retries) {
                console.log(`  Attempt ${attempt}/${retries} failed: ${error.message}`);
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }

    return null;
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🎬 YouTube Date Fetcher');
    console.log('========================\n');

    // Load episodes and cache
    const episodes = loadEpisodes();
    const cache = loadCache();

    console.log(`📊 Total episodes: ${episodes.length}`);
    console.log(`💾 Cached dates: ${Object.keys(cache).length}`);

    // Filter out already cached videos
    let toFetch = episodes.filter(ep => !cache[ep.youtubeId]);

    // Apply batch size limit if set
    const batchSize = parseInt(process.env.BATCH_SIZE) || 0;
    if (batchSize > 0 && toFetch.length > batchSize) {
        console.log(`📦 Batch size limit: ${batchSize}`);
        toFetch = toFetch.slice(0, batchSize);
    }

    console.log(`🔍 Videos to fetch: ${toFetch.length}\n`);

    if (toFetch.length === 0) {
        console.log('✅ All dates already cached!');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toFetch.length; i++) {
        const episode = toFetch[i];
        const progress = `[${i + 1}/${toFetch.length}]`;

        process.stdout.write(`${progress} EP.${episode.id}: ${episode.youtubeId} ... `);

        const dateISO = await fetchVideoDate(episode.youtubeId);

        if (dateISO) {
            const formatted = formatDate(dateISO);
            cache[episode.youtubeId] = {
                dateISO,
                dateFormatted: formatted,
                fetchedAt: new Date().toISOString()
            };
            saveCache(cache);
            successCount++;
            console.log(`✅ ${formatted}`);
        } else {
            failCount++;
            console.log(`❌ Failed`);
        }

        // Rate limiting - wait between requests
        if (i < toFetch.length - 1) {
            const delay = 1500 + Math.random() * 500; // 1.5-2 seconds
            await sleep(delay);
        }

        // Longer pause every 100 videos
        if ((i + 1) % 100 === 0 && i < toFetch.length - 1) {
            console.log('\n⏸️  Taking a 30 second break...\n');
            await sleep(30000);
        }
    }

    console.log('\n========================');
    console.log('📊 Summary:');
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  💾 Total cached: ${Object.keys(cache).length}`);
    console.log('\n✅ Done! Run update-episode-dates.cjs to apply changes.');
}

main().catch(console.error);
