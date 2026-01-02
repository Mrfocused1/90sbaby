# YouTube Video Scraping Strategy - 90s Baby Show

## Executive Summary

**Goal:** Extract metadata for all 2000+ videos from the 90s Baby Show YouTube channel

**Recommended Approach:** yt-dlp command-line tool

**Estimated Time:** 20 minutes total

**Fallback Options:** 3 alternative methods documented

---

## Why yt-dlp is the Best Choice

After researching multiple approaches, yt-dlp emerges as the clear winner:

✅ **No API limitations** - No quotas, no rate limits
✅ **No authentication** - No Google Cloud setup required
✅ **Fast execution** - Can extract 2000+ videos in ~5 minutes
✅ **Metadata-only mode** - Won't download video files
✅ **JSON output** - Easy to parse and transform
✅ **Community proven** - Gold standard for YouTube data extraction
✅ **Handles pagination** - Automatically scrolls through all videos

---

## Comparison of All Methods

| Method | Speed | Quota Limits | Setup Complexity | Reliability | Suitable for 2000+ videos? |
|--------|-------|--------------|------------------|-------------|---------------------------|
| **yt-dlp** | ⚡⚡⚡ Fast | ✅ None | 🟢 Simple | ⭐⭐⭐⭐⭐ | ✅ YES - RECOMMENDED |
| YouTube Data API v3 | ⚡⚡ Medium | ❌ 10K/day | 🟡 Medium | ⭐⭐⭐⭐ | ⚠️ Yes, but takes days |
| Channel RSS Feed | ⚡⚡⚡ Fast | ✅ None | 🟢 Simple | ⭐⭐⭐ | ❌ NO - Only last 15 videos |
| Browser Automation | ⚡ Slow | ✅ None | 🔴 Complex | ⭐⭐ | ⚠️ Yes, but 30-60 min runtime |
| Third-party APIs | ⚡⚡ Medium | 💰 Paid | 🟡 Medium | ⭐⭐⭐⭐ | ✅ Yes, but costs money |

---

## Implementation Steps

### Step 1: Install yt-dlp
```bash
brew install yt-dlp
```

### Step 2: Extract All Video Metadata
```bash
yt-dlp \
  --skip-download \
  --dump-json \
  --flat-playlist \
  "https://www.youtube.com/@90sBabyShow/videos" \
  > youtube_videos_raw.json
```

**What this does:**
- `--skip-download`: Only gets metadata, doesn't download videos
- `--dump-json`: Outputs data in JSON format
- `--flat-playlist`: Faster extraction for playlists/channels
- Saves to `youtube_videos_raw.json`

### Step 3: Process the Data
Create a script to transform raw JSON into our EPISODE_DB format with:
- Proper date formatting
- Thumbnail URLs
- Auto-generated tags
- Color assignments
- Sorted by upload date

### Step 4: Integrate into Website
- Move EPISODE_DB to separate file
- Import into App.jsx
- Add pagination (display 50 at a time)
- Ensure search works across all videos

---

## What I've Learned

### Previous Attempts:
1. **Browser subagent attempt** - User canceled (likely too slow or unreliable)

### Key Insights:
1. **Scale matters** - 2000+ videos requires efficient tooling, not manual scraping
2. **YouTube's anti-bot measures** - Need tools built to handle this (yt-dlp has workarounds)
3. **API quotas are limiting** - YouTube Data API's 10K daily quota insufficient for large channels
4. **Speed vs. reliability trade-off** - yt-dlp balances both well
5. **Metadata extraction ≠ video download** - Can get all data without downloading files

### Best Practices Discovered:
- Use `--flat-playlist` for speed on channels
- Parse JSON line-by-line (yt-dlp outputs one JSON object per line)
- Always test with small sample first (`--playlist-end 10`)
- Keep raw data separate from processed data
- Implement pagination for 2000+ items in UI

---

## Risk Management

### If yt-dlp fails:
**Primary fallback:** YouTube Data API v3
- More setup, but official and reliable
- May take 2-3 days due to quota limits

**Secondary fallback:** Browser automation
- Slower but guaranteed to work
- Use as last resort

### If website performance suffers:
- Implement virtual scrolling / windowing
- Add "Load More" pagination
- Lazy load thumbnails
- Consider moving data to separate JSON file loaded on demand

---

## Expected Output

After running yt-dlp, we'll have JSON objects with:
```json
{
  "id": "VIDEO_ID_HERE",
  "title": "VIDEO TITLE",
  "upload_date": "20250102",
  "duration": 3456,
  "view_count": 25000,
  "description": "...",
  "thumbnail": "...",
  ...
}
```

We'll transform this into:
```javascript
{
  id: 1,
  title: "VIDEO TITLE",
  date: "JAN 2025",
  tags: ["Guest", "Debate"],
  color: "bg-pink-600",
  youtubeId: "VIDEO_ID_HERE",
  thumbnail: "https://img.youtube.com/vi/VIDEO_ID_HERE/maxresdefault.jpg"
}
```

---

## Success Metrics

✅ Extract 1500+ videos minimum (target: all 2000+)
✅ < 20 minute total execution time
✅ All videos have valid YouTube IDs
✅ Thumbnails load correctly
✅ Website remains performant
✅ Search works across entire catalog

---

## Timeline

- **Now:** Plan complete ✅
- **+2 min:** Install yt-dlp
- **+7 min:** Extract all videos  
- **+17 min:** Process and format data
- **+20 min:** Integrate and test
- **Total:** 20 minutes to complete

Ready to execute! 🚀
