const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const EPISODE_FILE = path.join(__dirname, '../src/episodeData.js');
const CACHE_FILE = path.join(__dirname, 'youtube-dates-cache.json');

// Configuration
const MAX_CONSECUTIVE_FAILURES = 10;
const DELAY_BETWEEN_REQUESTS = 2000;
const REQUEST_TIMEOUT = 60000;

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
            console.log(`Loaded cache with ${Object.keys(data).length} entries`);
            return data;
        }
    } catch (e) {
        console.log('Cache load error:', e.message);
    }
    return {};
}

function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function loadEpisodes() {
    const content = fs.readFileSync(EPISODE_FILE, 'utf-8');
    const match = content.match(/export const EPISODE_DB = (\[[\s\S]*?\]);/);
    if (!match) {
        throw new Error('Could not parse episodeData.js');
    }
    return JSON.parse(match[1]);
}

function formatDate(dateStr) {
    if (/^\d{8}$/.test(dateStr)) {
        const year = dateStr.substring(0, 4);
        const month = parseInt(dateStr.substring(4, 6)) - 1;
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return `${monthNames[month]} ${year}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
        const date = new Date(dateStr);
        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    return null;
}

function fetchVideoDateYtDlp(videoId) {
    try {
        const result = spawnSync('yt-dlp', [
            '--skip-download',
            '--no-warnings',
            '--print', '%(upload_date)s',
            `https://www.youtube.com/watch?v=${videoId}`
        ], {
            encoding: 'utf-8',
            timeout: REQUEST_TIMEOUT,
            stdio: ['pipe', 'pipe', 'pipe']
        });

        if (result.status === 0 && result.stdout) {
            const date = result.stdout.trim();
            if (/^\d{8}$/.test(date)) {
                return date;
            }
        }

        if (result.stderr) {
            const errMsg = result.stderr.substring(0, 100);
            if (errMsg.includes('Video unavailable') || errMsg.includes('Private video')) {
                return 'UNAVAILABLE';
            }
        }

        return null;
    } catch (error) {
        return null;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('==========================================');
    console.log('  YouTube Date Fetcher v2.0');
    console.log('==========================================\n');

    try {
        const version = execSync('yt-dlp --version', { encoding: 'utf-8' }).trim();
        console.log(`yt-dlp version: ${version}`);
    } catch {
        console.error('ERROR: yt-dlp not found');
        process.exit(1);
    }

    let episodes;
    try {
        episodes = loadEpisodes();
        console.log(`Total episodes: ${episodes.length}`);
    } catch (e) {
        console.error('ERROR loading episodes:', e.message);
        process.exit(1);
    }

    const cache = loadCache();
    console.log(`Already cached: ${Object.keys(cache).length}`);

    let toFetch = episodes.filter(ep => ep.youtubeId && !cache[ep.youtubeId]);

    const batchSize = parseInt(process.env.BATCH_SIZE) || 0;
    if (batchSize > 0 && toFetch.length > batchSize) {
        console.log(`Batch limit: ${batchSize}`);
        toFetch = toFetch.slice(0, batchSize);
    }

    console.log(`Videos to fetch: ${toFetch.length}\n`);

    if (toFetch.length === 0) {
        console.log('All videos already cached!');
        return;
    }

    let successCount = 0;
    let failCount = 0;
    let unavailableCount = 0;
    let consecutiveFailures = 0;

    console.log('Starting fetch...\n');

    for (let i = 0; i < toFetch.length; i++) {
        const episode = toFetch[i];
        const progress = `[${i + 1}/${toFetch.length}]`;

        process.stdout.write(`${progress} ${episode.youtubeId} ... `);

        const dateStr = fetchVideoDateYtDlp(episode.youtubeId);

        if (dateStr === 'UNAVAILABLE') {
            cache[episode.youtubeId] = {
                dateISO: null,
                dateFormatted: 'UNAVAILABLE',
                fetchedAt: new Date().toISOString(),
                status: 'unavailable'
            };
            saveCache(cache);
            unavailableCount++;
            consecutiveFailures = 0;
            console.log('UNAVAILABLE');
        } else if (dateStr) {
            const formatted = formatDate(dateStr);
            cache[episode.youtubeId] = {
                dateISO: dateStr,
                dateFormatted: formatted,
                fetchedAt: new Date().toISOString()
            };
            saveCache(cache);
            successCount++;
            consecutiveFailures = 0;
            console.log(formatted);
        } else {
            failCount++;
            consecutiveFailures++;
            console.log('FAILED');

            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                console.log(`\nWARNING: ${MAX_CONSECUTIVE_FAILURES} consecutive failures - stopping`);
                break;
            }
        }

        if (i < toFetch.length - 1) {
            await sleep(DELAY_BETWEEN_REQUESTS);
        }

        if ((i + 1) % 25 === 0) {
            console.log(`\n--- Progress: ${successCount} success, ${failCount} failed ---\n`);
        }
    }

    console.log('\n==========================================');
    console.log('  SUMMARY');
    console.log('==========================================');
    console.log(`  Success:     ${successCount}`);
    console.log(`  Failed:      ${failCount}`);
    console.log(`  Unavailable: ${unavailableCount}`);
    console.log(`  Total cached: ${Object.keys(cache).length}`);
    console.log('==========================================\n');

    // Exit successfully if we made any progress
    if (successCount > 0 || unavailableCount > 0) {
        console.log('Completed with progress.');
        process.exit(0);
    } else if (failCount > 0) {
        console.log('No progress made - all attempts failed.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('FATAL ERROR:', err.message);
    process.exit(1);
});
