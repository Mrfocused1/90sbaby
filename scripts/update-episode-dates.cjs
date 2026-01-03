const fs = require('fs');
const path = require('path');

const EPISODE_FILE = path.join(__dirname, '../src/episodeData.js');
const CACHE_FILE = path.join(__dirname, 'youtube-dates-cache.json');

function loadCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
        }
    } catch (e) {
        console.log('Cache load error:', e.message);
    }
    return {};
}

function loadEpisodes() {
    const content = fs.readFileSync(EPISODE_FILE, 'utf-8');
    const match = content.match(/export const EPISODE_DB = (\[[\s\S]*?\]);/);
    if (!match) {
        throw new Error('Could not parse episodeData.js');
    }
    return JSON.parse(match[1]);
}

function main() {
    console.log('==========================================');
    console.log('  Episode Date Updater');
    console.log('==========================================\n');

    const cache = loadCache();
    const cacheCount = Object.keys(cache).length;

    if (cacheCount === 0) {
        console.log('No cached dates found. Nothing to update.');
        process.exit(0);
    }

    const episodes = loadEpisodes();

    console.log(`Episodes: ${episodes.length}`);
    console.log(`Cached dates: ${cacheCount}\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    let missingCount = 0;
    let unavailableCount = 0;

    const updatedEpisodes = episodes.map(episode => {
        const cachedData = cache[episode.youtubeId];

        if (!cachedData) {
            missingCount++;
            return episode;
        }

        if (cachedData.status === 'unavailable' || cachedData.dateFormatted === 'UNAVAILABLE') {
            unavailableCount++;
            return episode;
        }

        if (cachedData.dateFormatted && episode.date !== cachedData.dateFormatted) {
            console.log(`EP.${episode.id}: "${episode.date}" -> "${cachedData.dateFormatted}"`);
            updatedCount++;
            return { ...episode, date: cachedData.dateFormatted };
        }

        unchangedCount++;
        return episode;
    });

    const outputContent = `export const EPISODE_DB = ${JSON.stringify(updatedEpisodes, null, 2)};`;
    fs.writeFileSync(EPISODE_FILE, outputContent);

    console.log('\n==========================================');
    console.log('  SUMMARY');
    console.log('==========================================');
    console.log(`  Updated:     ${updatedCount}`);
    console.log(`  Unchanged:   ${unchangedCount}`);
    console.log(`  Missing:     ${missingCount}`);
    console.log(`  Unavailable: ${unavailableCount}`);
    console.log('==========================================\n');

    if (updatedCount > 0) {
        console.log('episodeData.js has been updated!');
    } else {
        console.log('No changes needed.');
    }
}

main();
