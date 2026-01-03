const fs = require('fs');
const path = require('path');
const https = require('https');

const EPISODE_FILE = path.join(__dirname, '../src/episodeData.js');
const CACHE_FILE = path.join(__dirname, 'youtube-dates-cache.json');

// YouTube Data API v3 - FREE, reliable, no rate limiting issues
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3/videos';
const BATCH_SIZE = 50; // Max videos per API request

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

function formatDate(isoDate) {
    const date = new Date(isoDate);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Fetch video data from YouTube Data API v3
function fetchVideoBatch(videoIds, apiKey) {
    return new Promise((resolve, reject) => {
        const ids = videoIds.join(',');
        const url = `${YOUTUBE_API_BASE}?part=snippet&id=${ids}&key=${apiKey}`;

        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.error) {
                        reject(new Error(`API Error: ${json.error.message}`));
                        return;
                    }
                    resolve(json.items || []);
                } catch (e) {
                    reject(new Error(`Parse error: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
}

// Split array into chunks
function chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

async function main() {
    console.log('==========================================');
    console.log('  YouTube Date Fetcher v3.0');
    console.log('  Using YouTube Data API v3 (Official)');
    console.log('==========================================\n');

    // Get API key from environment
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
        console.error('ERROR: YOUTUBE_API_KEY environment variable not set');
        console.error('\nTo fix this:');
        console.error('1. Get a free API key from Google Cloud Console');
        console.error('2. Add it as a GitHub secret named YOUTUBE_API_KEY');
        console.error('3. Run this workflow again');
        process.exit(1);
    }

    console.log('API Key: ****' + apiKey.slice(-4));

    // Load episodes and cache
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

    // Filter uncached videos
    const toFetch = episodes.filter(ep => ep.youtubeId && !cache[ep.youtubeId]);
    console.log(`Videos to fetch: ${toFetch.length}\n`);

    if (toFetch.length === 0) {
        console.log('All videos already cached!');
        return;
    }

    // Extract video IDs and batch them
    const videoIds = toFetch.map(ep => ep.youtubeId);
    const batches = chunkArray(videoIds, BATCH_SIZE);

    console.log(`Fetching in ${batches.length} batches of up to ${BATCH_SIZE} videos each...`);
    console.log(`API quota cost: ~${batches.length} units (limit: 10,000/day)\n`);

    let successCount = 0;
    let notFoundCount = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`[Batch ${i + 1}/${batches.length}] Fetching ${batch.length} videos...`);

        try {
            const videos = await fetchVideoBatch(batch, apiKey);

            // Create a map of returned videos
            const videoMap = {};
            for (const video of videos) {
                videoMap[video.id] = video;
            }

            // Process each video ID in the batch
            for (const videoId of batch) {
                const video = videoMap[videoId];

                if (video && video.snippet && video.snippet.publishedAt) {
                    const publishedAt = video.snippet.publishedAt;
                    const formatted = formatDate(publishedAt);

                    cache[videoId] = {
                        dateISO: publishedAt,
                        dateFormatted: formatted,
                        title: video.snippet.title,
                        fetchedAt: new Date().toISOString()
                    };
                    successCount++;
                    console.log(`  ${videoId}: ${formatted}`);
                } else {
                    // Video not found (deleted/private)
                    cache[videoId] = {
                        dateISO: null,
                        dateFormatted: 'UNAVAILABLE',
                        fetchedAt: new Date().toISOString(),
                        status: 'not_found'
                    };
                    notFoundCount++;
                    console.log(`  ${videoId}: NOT FOUND`);
                }
            }

            // Save cache after each batch
            saveCache(cache);

        } catch (error) {
            console.error(`  Batch error: ${error.message}`);

            // Check if it's a quota error
            if (error.message.includes('quota')) {
                console.error('\nQuota exceeded! Try again tomorrow.');
                break;
            }
        }

        // Small delay between batches to be nice to the API
        if (i < batches.length - 1) {
            await new Promise(r => setTimeout(r, 500));
        }
    }

    console.log('\n==========================================');
    console.log('  SUMMARY');
    console.log('==========================================');
    console.log(`  Success:     ${successCount}`);
    console.log(`  Not Found:   ${notFoundCount}`);
    console.log(`  Total cached: ${Object.keys(cache).length}`);
    console.log('==========================================\n');

    if (successCount > 0 || notFoundCount > 0) {
        console.log('Completed successfully!');
    }

    process.exit(0);
}

main().catch(err => {
    console.error('FATAL ERROR:', err.message);
    process.exit(1);
});
