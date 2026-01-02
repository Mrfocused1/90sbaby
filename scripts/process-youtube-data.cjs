const fs = require('fs');
const path = require('path');

const RAW_FILE = path.join(__dirname, '../youtube_videos_ids_titles.json');
const OUTPUT_FILE = path.join(__dirname, '../src/episodeData.js');

try {
    const fileContent = fs.readFileSync(RAW_FILE, 'utf-8').trim();
    if (!fileContent) {
        console.error('Raw JSON file is empty.');
        process.exit(1);
    }

    const lines = fileContent.split('\n');
    console.log(`Processing ${lines.length} videos...`);

    // We'll give them approximate dates based on their position in the list
    // since the list is newest -> oldest
    const episodes = lines.map((line, index) => {
        try {
            const video = JSON.parse(line);
            const title = video.title;
            const youtubeId = video.id;
            const thumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`; // Use mqdefault for faster loading and reliability

            // Tag Detection
            const tags = [];
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('ft.') || lowerTitle.includes('ft ') || lowerTitle.includes('feat')) tags.push('Guest');
            if (lowerTitle.includes('?') || lowerTitle.includes('debate')) tags.push('Debate');
            if (lowerTitle.includes('funny') || lowerTitle.includes('laugh')) tags.push('Funny');
            if (lowerTitle.includes('relationship') || lowerTitle.includes('date') || lowerTitle.includes('marriage')) tags.push('Relationships');
            if (lowerTitle.includes('storytime') || lowerTitle.includes('story')) tags.push('Storytime');

            if (tags.length === 0) tags.push('Episode');

            // Colors
            const colors = ['bg-pink-600', 'bg-purple-600', 'bg-cyan-600', 'bg-yellow-500', 'bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-orange-500', 'bg-zinc-600'];
            const color = colors[index % colors.length];

            // Approximate date mapping
            // Roughly 2263 videos over 10 years (2016-2026)?
            // Approx 226 videos per year.
            const yearOffset = Math.floor(index / 226);
            const year = 2026 - yearOffset;
            const monthNames = ["DEC", "NOV", "OCT", "SEP", "AUG", "JUL", "JUN", "MAY", "APR", "MAR", "FEB", "JAN"];
            const monthIndex = Math.floor((index % 226) / 19); // 12 months * 19 eps = 228
            const month = monthNames[monthIndex % 12];

            const formattedDate = index < 100 ? `${month} ${year}` : "ARCHIVE TAPE";

            return {
                id: lines.length - index,
                title,
                date: formattedDate,
                tags: tags.slice(0, 2),
                color,
                youtubeId,
                thumbnail
            };
        } catch (e) {
            return null;
        }
    }).filter(ep => ep !== null);

    const outputContent = `export const EPISODE_DB = ${JSON.stringify(episodes, null, 2)};`;
    fs.writeFileSync(OUTPUT_FILE, outputContent);

    console.log(`✅ Successfully generated ${episodes.length} episodes in src/episodeData.js`);

} catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
}
