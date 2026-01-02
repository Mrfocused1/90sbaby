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
    console.log(`Analyzing ${lines.length} total videos for long-form content...`);

    const episodes = lines.map((line, index) => {
        try {
            const video = JSON.parse(line);

            // FILTER: Only keep videos longer than 15 minutes (900 seconds)
            // This effectively removes all Shorts and short Clips.
            if (!video.duration || video.duration < 900) {
                return null;
            }

            const title = video.title;
            const youtubeId = video.id;
            const thumbnail = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;

            // Tag Detection
            const tags = [];
            const lowerTitle = title.toLowerCase();
            if (lowerTitle.includes('ft.') || lowerTitle.includes('ft ') || lowerTitle.includes('feat')) tags.push('Guest');
            if (lowerTitle.includes('?') || lowerTitle.includes('debate')) tags.push('Debate');
            if (lowerTitle.includes('funny') || lowerTitle.includes('laugh')) tags.push('Funny');
            if (lowerTitle.includes('relationship') || lowerTitle.includes('date') || lowerTitle.includes('marriage')) tags.push('Relationships');
            if (lowerTitle.includes('live')) tags.push('Live');

            if (tags.length === 0) tags.push('Episode');

            // Colors
            const colors = ['bg-pink-600', 'bg-purple-600', 'bg-cyan-600', 'bg-yellow-500', 'bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-orange-500', 'bg-zinc-600'];
            const color = colors[index % colors.length];

            return {
                id: 0, // Will be set after filtering
                title,
                date: "", // Will be set after filtering
                tags: tags.slice(0, 2),
                color,
                youtubeId,
                thumbnail,
                originalIndex: index // To keep chronological order
            };
        } catch (e) {
            return null;
        }
    }).filter(ep => ep !== null);

    console.log(`Filtered down to ${episodes.length} long-form episodes.`);

    // Assign IDs and Dates based on order (newest to oldest)
    // Assuming roughly 1 episode per week, starting from late 2025/early 2026 back to 2016
    const totalEpisodes = episodes.length;
    const finalEpisodes = episodes.map((ep, idx) => {
        const epNum = totalEpisodes - idx;

        // Roughly map to date
        // Each year has ~52-60 long form videos (episodes)
        const weeksBack = idx;
        const date = new Date(2025, 11, 29); // Start Dec 29, 2025
        date.setDate(date.getDate() - (weeksBack * 7));

        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const formattedDate = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

        return {
            ...ep,
            id: epNum,
            date: formattedDate
        };
    });

    const outputContent = `export const EPISODE_DB = ${JSON.stringify(finalEpisodes, null, 2)};`;
    fs.writeFileSync(OUTPUT_FILE, outputContent);

    console.log(`✅ Successfully generated ${finalEpisodes.length} episodes in src/episodeData.js`);

} catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
}
