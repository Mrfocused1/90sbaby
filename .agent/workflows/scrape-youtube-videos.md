---
description: Comprehensive plan to scrape all 2000+ videos from 90s Baby Show YouTube channel
---

# YouTube Video Scraping Plan for 90s Baby Show

## Objective
Extract metadata for all 2000+ videos from the 90s Baby Show YouTube channel (@90sBabyShow) and integrate them into the website.

## Context & Previous Attempts
- Currently have 9 videos manually collected
- Browser subagent task was canceled by user
- Need a scalable, reliable method for 2000+ videos
- YouTube has anti-scraping measures and ToS restrictions

---

## Multi-Approach Strategy (Ordered by Priority)

### **APPROACH 1: yt-dlp (Command-Line Tool) - RECOMMENDED**
**Best for:** 2000+ videos, no API quotas, fast, reliable

#### Advantages:
- ✅ No API key required
- ✅ No quota limits
- ✅ Handles pagination automatically
- ✅ Extracts all metadata without downloading videos
- ✅ Fast and proven for large channels
- ✅ Outputs JSON format directly

#### Installation & Execution:
```bash
# Step 1: Install yt-dlp (if not installed)
brew install yt-dlp

# Step 2: Extract all video metadata from channel (no downloads)
yt-dlp \
  --skip-download \
  --dump-json \
  --flat-playlist \
  "https://www.youtube.com/@90sBabyShow/videos" \
  > youtube_videos_raw.json

# Step 3: Parse and format the data
# This will extract: title, id, upload_date, duration, view_count, etc.
```

#### Data Processing:
After extracting raw JSON, parse it to create our EPISODE_DB format:
- Extract: `title`, `id` (video ID), `upload_date`
- Generate thumbnail URL: `https://img.youtube.com/vi/{id}/maxresdefault.jpg`
- Format date from YYYYMMDD to "MMM YYYY"
- Auto-categorize tags based on title keywords

#### Estimated Time: 
- Installation: 2 minutes
- Extraction: 5-10 minutes for 2000 videos
- Processing: 5-10 minutes
- **Total: ~20 minutes**

---

### **APPROACH 2: YouTube Data API v3 (Official Method)**
**Best for:** Smaller channels, need additional metadata like view counts, likes

#### Advantages:
- ✅ Official Google API
- ✅ Well-documented
- ✅ Returns structured data
- ✅ Can get channel statistics

#### Disadvantages:
- ❌ Requires API key setup
- ❌ Daily quota limit (10,000 units/day)
- ❌ Each video = ~1 unit, 2000 videos = multiple days
- ❌ More complex setup

#### Process:
1. Create Google Cloud project
2. Enable YouTube Data API v3
3. Generate API key
4. Get channel's "uploads" playlist ID via `channels.list`
5. Paginate through `playlistItems.list` (50 videos at a time)
6. Handle pagination with `nextPageToken`

#### Quota Calculation:
- Getting uploads playlist: 1 unit
- Getting 50 videos: ~3 units
- For 2000 videos: ~120 units per run
- **Could complete in 1 day, but requires API setup**

---

### **APPROACH 3: Channel RSS Feed (Quick & Simple)**
**Best for:** Most recent ~15 videos only

#### Advantages:
- ✅ No authentication required
- ✅ XML format, easy to parse
- ✅ Quick setup

#### Disadvantages:
- ❌ **ONLY returns last 15 videos** - NOT suitable for 2000+ videos
- ❌ Limited metadata

#### Process:
```bash
# RSS feed URL format
https://www.youtube.com/feeds/videos.xml?channel_id=CHANNEL_ID
```

**VERDICT: Not suitable for this project due to 15-video limit**

---

### **APPROACH 4: Browser Automation with Infinite Scroll**
**Best for:** When other methods fail

#### Advantages:
- ✅ No API key needed
- ✅ Can handle dynamic content

#### Disadvantages:
- ❌ Slow (must scroll through all 2000+ videos)
- ❌ Can be detected/blocked by YouTube
- ❌ Requires headless browser
- ❌ Fragile (breaks if YouTube changes UI)
- ❌ Estimated 30-60 minutes runtime

#### Process:
1. Use Puppeteer/Playwright
2. Navigate to channel videos page
3. Scroll repeatedly until all videos load
4. Parse DOM for video data
5. Extract from HTML/JSON embedded in page

**VERDICT: Use as last resort only**

---

### **APPROACH 5: Third-Party Services (Apify, ScraperAPI)**
**Best for:** Enterprise projects with budget

#### Disadvantages:
- ❌ Costs money ($)
- ❌ Requires account setup
- ❌ Overkill for this project

**VERDICT: Not recommended for personal project**

---

## Recommended Implementation Path

### Phase 1: Quick Win with yt-dlp (EXECUTE FIRST)
// turbo-all
```bash
# 1. Check if yt-dlp is installed
which yt-dlp

# 2. If not installed, install it
brew install yt-dlp

# 3. Test with first 10 videos
yt-dlp \
  --skip-download \
  --dump-json \
  --playlist-end 10 \
  "https://www.youtube.com/@90sBabyShow/videos"

# 4. If test succeeds, get ALL videos
yt-dlp \
  --skip-download \
  --dump-json \
  --flat-playlist \
  "https://www.youtube.com/@90sBabyShow/videos" \
  > /Users/paulbridges/Downloads/90sbaby/youtube_videos_raw.json

# 5. Check file size to confirm data was captured
ls -lh /Users/paulbridges/Downloads/90sbaby/youtube_videos_raw.json
```

### Phase 2: Parse and Transform Data
Create a Node.js script to process the raw JSON:

```javascript
// scripts/process-youtube-data.js
const fs = require('fs');

const rawData = fs.readFileSync('youtube_videos_raw.json', 'utf-8');
const videos = rawData.trim().split('\n').map(line => JSON.parse(line));

const EPISODE_DB = videos.map((video, index) => {
  const uploadDate = video.upload_date || video.timestamp;
  const dateObj = new Date(
    uploadDate.toString().slice(0, 4),
    uploadDate.toString().slice(4, 6) - 1,
    uploadDate.toString().slice(6, 8)
  );
  
  const monthYear = dateObj.toLocaleDateString('en-US', { 
    month: 'short', 
    year: 'numeric' 
  }).toUpperCase();

  // Auto-categorize tags based on title
  const tags = detectTags(video.title);
  
  return {
    id: index + 1,
    title: video.title,
    date: monthYear,
    tags: tags,
    color: getColorForIndex(index),
    youtubeId: video.id,
    thumbnail: `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
    uploadDate: uploadDate, // Keep for sorting
    duration: video.duration,
    viewCount: video.view_count
  };
});

// Sort by upload date (newest first)
EPISODE_DB.sort((a, b) => b.uploadDate - a.uploadDate);

// Write to file
fs.writeFileSync(
  'src/episodeData.js',
  `export const EPISODE_DB = ${JSON.stringify(EPISODE_DB, null, 2)};`
);

console.log(`✅ Processed ${EPISODE_DB.length} videos`);

function detectTags(title) {
  const tags = [];
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('ft.') || titleLower.includes('ft ')) tags.push('Guest');
  if (titleLower.match(/\?$/)) tags.push('Debate');
  if (titleLower.includes('storytime')) tags.push('Storytime');
  // Add more tag detection logic
  
  return tags.length > 0 ? tags : ['Episode'];
}

function getColorForIndex(index) {
  const colors = [
    'bg-pink-600', 'bg-purple-600', 'bg-cyan-600', 'bg-yellow-500',
    'bg-red-600', 'bg-green-600', 'bg-blue-600', 'bg-orange-500',
    'bg-zinc-600'
  ];
  return colors[index % colors.length];
}
```

### Phase 3: Integration
1. Move EPISODE_DB to separate file for better organization
2. Import into App.jsx
3. Add pagination to Archive (display 50 at a time)
4. Add "Load More" button or infinite scroll

---

## Fallback Strategy (If yt-dlp Fails)

### Option A: YouTube Data API
1. Create Google Cloud project
2. Enable API and get key
3. Run collection script (may take multiple days due to quotas)

### Option B: Manual Channel Page Scraping
1. Use read_url_content on channel page
2. Parse embedded JSON data
3. Limited to first ~30 videos visible

### Option C: Browser Automation
1. Use browser_subagent with extended timeout
2. Scroll and collect video IDs manually
3. Process in batches

---

## Success Criteria
- ✅ Extract at least 1500+ videos (aiming for all 2000+)
- ✅ Each video has: title, youtubeId, date, thumbnail
- ✅ Data is properly formatted for EPISODE_DB
- ✅ Website loads and displays videos correctly
- ✅ Search functionality works across all videos
- ✅ Archive page has pagination for performance

---

## Risk Mitigation
1. **yt-dlp gets blocked**: Switch to YouTube Data API
2. **API quota exceeded**: Spread collection over multiple days
3. **Too many videos cause performance issues**: Implement pagination/lazy loading
4. **Some thumbnails fail to load**: Already have error handling with fallback SVG

---

## Next Steps
1. ✅ Execute Phase 1 (this plan)
2. Run yt-dlp to extract all video metadata
3. Process and format the data
4. Update App.jsx with new EPISODE_DB
5. Test website performance with 2000+ videos
6. Add pagination if needed
