const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

// Save cache
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
function formatDate(dateStr) {
    // Handle YYYYMMDD format from yt-dlp
    if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return `${monthNames[month]} ${year}`;
    }
    // Handle ISO format
    const date = new Date(dateStr);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Fetch video date using yt-dlp
function fetchVideoDate(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    try {
        const result = execSync(
            `yt-dlp --skip-download --print "%(upload_date)s" "${url}" 2>/dev/null`,
            { encoding: 'utf-8', timeout: 30000 }
        ).trim();

        if (result && /^\d{8}$/.test(result)) {
            return result;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Sleep helper
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🎬 YouTube Date Fetcher (yt-dlp)');
    console.log('=================================\n');

    // Check if yt-dlp is installed
    try {
        execSync('which yt-dlp', { encoding: 'utf-8' });
    } catch {
        console.log('Installing yt-dlp...');
        execSync('pip install yt-dlp', { stdio: 'inherit' });
    }

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

        const dateStr = fetchVideoDate(episode.youtubeId);

        if (dateStr) {
            const formatted = formatDate(dateStr);
            cache[episode.youtubeId] = {
                dateISO: dateStr,
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
            await sleep(1000);
        }

        // Save progress every 50 videos
        if ((i + 1) % 50 === 0) {
            console.log(`\n💾 Progress saved (${Object.keys(cache).length} cached)\n`);
        }
    }

    console.log('\n=================================');
    console.log('📊 Summary:');
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);
    console.log(`  💾 Total cached: ${Object.keys(cache).length}`);
}

main().catch(err => {
    console.error('Fatal error:', err.message);
    process.exit(1);
});
