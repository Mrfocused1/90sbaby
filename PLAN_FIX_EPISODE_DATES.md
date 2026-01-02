# Plan: Fix Episode Dates to Match YouTube

## Problem Analysis

**Root Cause Identified:**
The current `scripts/process-youtube-data.cjs` (lines 63-83) **estimates** dates using this flawed logic:
```javascript
const weeksBack = idx;
const date = new Date(2025, 11, 29); // Start Dec 29, 2025
date.setDate(date.getDate() - (weeksBack * 7));
```

This creates fictional dates that don't match actual YouTube publish dates.

**Current State:**
- 569 episodes with YouTube video IDs in `src/episodeData.js`
- All dates are estimated/incorrect
- Example: EP.279 shows "JUN 2020" but YouTube shows ~2022-2023

## Solution: Playwright-Based Date Fetching

### Why Playwright?
1. No YouTube API key required
2. Can extract exact publish dates from video pages
3. Already installed in the environment
4. Can also be used for verification testing

### Implementation Steps

#### Step 1: Create Date Fetching Script
Create `scripts/fetch-youtube-dates.cjs` that:
1. Reads all YouTube video IDs from `episodeData.js`
2. Uses Playwright to visit each video page
3. Extracts the actual publish date from the page
4. Handles rate limiting with delays between requests
5. Saves results to a JSON cache file

#### Step 2: Create Date Update Script
Create `scripts/update-episode-dates.cjs` that:
1. Reads the fetched dates from cache
2. Updates `episodeData.js` with correct dates
3. Preserves all other episode data

#### Step 3: Verification Script
Create `scripts/verify-dates.cjs` that:
1. Uses Playwright to check random sample of episodes
2. Compares website dates with YouTube dates
3. Reports any mismatches

### Technical Details

**Extracting Date from YouTube:**
- YouTube shows publish date in the video page metadata
- Can be found in `<meta itemprop="datePublished">` or in the page's JSON-LD data
- Format: ISO 8601 (e.g., "2022-06-15T14:00:00Z")

**Rate Limiting Strategy:**
- Add 2-3 second delay between requests
- Process in batches of 50 with longer pauses
- Total time estimate: ~30-40 minutes for 569 videos

**Error Handling:**
- Retry failed requests up to 3 times
- Log failures for manual review
- Continue processing even if some videos fail

### Verification Process

After updating dates:
1. Run Playwright to visit the website's episodes page
2. Select random episodes and compare displayed dates
3. Visit corresponding YouTube videos
4. Verify dates match (within same month/year)

## Risk Mitigation

**Learned from past mistakes:**
1. **Don't estimate** - Fetch actual data
2. **Cache intermediate results** - Save fetched dates to file in case of interruption
3. **Verify before committing** - Test with Playwright before pushing changes
4. **Handle errors gracefully** - Don't let one failure stop the entire process

## Execution Order

1. [ ] Create `scripts/fetch-youtube-dates.cjs`
2. [ ] Run script to fetch all dates (save to `scripts/youtube-dates-cache.json`)
3. [ ] Create `scripts/update-episode-dates.cjs`
4. [ ] Run update script to fix `episodeData.js`
5. [ ] Create `scripts/verify-dates.cjs`
6. [ ] Run verification to confirm fixes
7. [ ] Commit and push changes

## Estimated Time
- Script development: 15-20 minutes
- Date fetching: 30-40 minutes (569 videos × 3-4 seconds each)
- Verification: 5-10 minutes
- Total: ~1 hour
