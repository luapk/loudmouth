# LOUDMOUTH v3

Cultural sensing engine for Oral-B's Gen Z health positioning. Harvests real Reddit posts and comments, YouTube comment threads, and TikTok Creative Center trends per market, clusters them with Claude into stable tensions and live expressions, gates every expression against the product truths (pressure sensor, timer, app score, price), and attaches receipts: actual quotes linked to their threads. Culture maps and unbranded probe briefs generate on demand.

## Architecture

- `src/` Vite + React front end. Password gated (client-side, cosmetic).
- `api/harvest.js` runs three collectors in parallel, each failing independently:
  - **Reddit** (honesty layer): OAuth search across market subreddits per mouth-as-context query, plus top comments from the strongest threads.
  - **YouTube** (reaction layer): Data API v3 search per query with regionCode and relevanceLanguage, then commentThreads on the top videos.
  - **TikTok** (cultural weather): Creative Center trending hashtags for the market this week. Unofficial public endpoint, brittle by design; when it fails the scan continues and the UI says so.
- `api/cluster.js` one Claude call turns the evidence into the two-speed structure with evidence citations.
- `api/culture.js` two-pass web search for named cultural specimens (search returns notes, format pass may not invent names).
- `api/probe.js` unbranded pre-spend validation brief per certified expression.

Market and query configuration lives in `api/_lib.js` (MARKET_CONFIG). Add markets or tune the localised queries there.

## Setup

### 1. Reddit app

Go to https://www.reddit.com/prefs/apps while logged in. Create app, type **script**. Redirect URI can be `http://localhost` (unused). Note the client id (under the app name) and the secret.

Reddit's free API tier at 100 queries per minute is far more than this tool uses. A scan makes roughly 15 requests.


### 2. YouTube API key

Go to https://console.cloud.google.com, create a project, enable **YouTube Data API v3**, create an API key under Credentials. Free quota is 10,000 units per day; a scan costs roughly 510 units (search is expensive at 100 units, comments are 1), so about 19 full scans a day on the free tier. If `YOUTUBE_API_KEY` is missing the scan runs without YouTube and tells you.

### 3. TikTok

No key needed. The Creative Center endpoint is unofficial and can start returning 403 without notice. Treat it as a bonus layer: trends inform how Claude localises the framing, they are not evidence. The proper long-term route is TikTok's Research API, applied for under P&G's name.

### 4. Environment variables

Copy `.env.example` to `.env` for local dev, and add the same variables in Vercel project settings for deployment:

- `ANTHROPIC_API_KEY` from console.anthropic.com
- `REDDIT_CLIENT_ID` and `REDDIT_CLIENT_SECRET` from step 1
- `REDDIT_USER_AGENT` e.g. `web:loudmouth:v3.0 (by /u/yourusername)`. Reddit requires a descriptive user agent.
- `YOUTUBE_API_KEY` from Google Cloud console (optional, scan degrades gracefully without it)
- `MODEL` optional, defaults to `claude-sonnet-4-6`

### 5. Local dev

```
npm install
npm i -g vercel
vercel dev
```

`vercel dev` runs the Vite front end and the serverless functions together. Plain `npm run dev` serves the UI only, API calls will 404.

### 6. Deploy

Push to GitHub, import in Vercel, add the env vars, deploy. `vercel.json` already sets `maxDuration: 60` for the functions.

The UI password is `mouth2026`, set in `src/App.jsx` (PASSWORD constant). It is client-side gating in the usual internal-tool style, not security.

## Honest limits

- TikTok gives trends, not comments. Real TikTok comment access needs the Research API (or commercial scrapers like Apify or EnsembleData for a demo). The trend layer is still useful: it tells Claude what the market's feed looks like this week.
- Culture map specimens come from live web search. The pipeline is instructed never to invent names and to skip empty categories, but verify every name before it goes anywhere near a deck.
- Subreddits are a market proxy, not a census. German Reddit skews educated and male; Spanish and Italian Reddit are small relative to their TikTok cultures. Treat Reddit signal as the honesty layer, not the whole picture.
- Client-side password gating keeps casual traffic out, nothing more. Do not put client-confidential data in the seed.
