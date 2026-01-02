const fs = require('fs');
const path = require('path');

const EPISODE_FILE = path.join(__dirname, '../src/episodeData.js');
const CACHE_FILE = path.join(__dirname, 'youtube-dates-cache.json');

function loadCache() {
    try {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch (e) {
        console.error('❌ Could not load cache file. Run fetch-youtube-dates.cjs first.');
        process.exit(1);
    }
}

function loadEpisodes() {
    const content = fs.readFileSync(EPISODE_FILE, 'utf-8');
    const match = content.match(/export const EPISODE_DB = (\[[\s\S]*\]);/);
    if (!match) {
        throw new Error('Could not parse episodeData.js');
    }
    return JSON.parse(match[1]);
}

function main() {
    console.log('📝 Episode Date Updater');
    console.log('========================\n');

    const cache = loadCache();
    const episodes = loadEpisodes();

    console.log(`📊 Episodes: ${episodes.length}`);
    console.log(`💾 Cached dates: ${Object.keys(cache).length}\n`);

    let updatedCount = 0;
    let unchangedCount = 0;
    let missingCount = 0;

    const updatedEpisodes = episodes.map(episode => {
        const cachedData = cache[episode.youtubeId];

        if (cachedData && cachedData.dateFormatted) {
            if (episode.date !== cachedData.dateFormatted) {
                console.log(`EP.${episode.id}: "${episode.date}" → "${cachedData.dateFormatted}"`);
                updatedCount++;
                return {
                    ...episode,
                    date: cachedData.dateFormatted
                };
            } else {
                unchangedCount++;
                return episode;
            }
        } else {
            missingCount++;
            console.log(`EP.${episode.id}: No cached date (keeping "${episode.date}")`);
            return episode;
        }
    });

    // Write updated episodes back to file
    const outputContent = `export const EPISODE_DB = ${JSON.stringify(updatedEpisodes, null, 2)};`;
    fs.writeFileSync(EPISODE_FILE, outputContent);

    console.log('\n========================');
    console.log('📊 Summary:');
    console.log(`  ✅ Updated: ${updatedCount}`);
    console.log(`  ⏸️  Unchanged: ${unchangedCount}`);
    console.log(`  ⚠️  Missing: ${missingCount}`);
    console.log('\n✅ episodeData.js has been updated!');
}

main();
