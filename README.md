# LOUDMOUTH v4

Cultural sensing engine for Oral-B's Gen Z health positioning (adam&eveTBWA; markets: UK, US, DE, FR, ES, IT). v4 replaces mandatory social-API ingestion with an intelligent web-search harvest driven by the Anthropic web search tool, so the only required key is `ANTHROPIC_API_KEY`.

Each scan teaches itself this month's live vocabulary of the mouth in culture, reads the market's pulse (charting tracks and live memes), sweeps the four currencies of health by web search, then clusters the dated, sourced evidence into stable tensions and live expressions, gating every expression against the product truths. The strategic spine (four currencies, two-speed model, bridge gates, kill rate) is unchanged from v3.

## What is fixed and what is fluid

- **Fixed, never generated:** the four currencies (AES aesthetic, DAT data/tracking, EMO emotional/mental, ECO economic/afford); the two-speed model (tensions hold for years, expressions churn weekly); the bridge gates and their product truths (pressure sensor, 2-minute timer, app score, sub-50 price); the pinned chart sources.
- **Generated fresh every scan:** the search vocabulary. A discovery pass asks "what is the current language of this currency in this market's Gen Z culture right now?" and the terms it finds drive the sweep. Priors in `api/_lib.js` are hints, not walls, with a 2-query evergreen floor per currency so a weak discovery degrades to a mediocre scan, never an empty one.

## The scan pipeline

Client-orchestrated in stages so each serverless function stays inside Vercel's 60s limit. Roughly 12 to 16 web searches per market.

1. `POST /api/discover { market }` — one search per currency. Returns this month's vocabulary per currency in the local language.
2. `POST /api/pulse { market }` — the 5 tracks currently charting (Spotify, Shazam, kworb.net, cross-referenced) and the 3 memes currently live. Everything dated, sourced and confidence-flagged.
3. `POST /api/sweep { market, currency, vocabulary }` — called once per currency, searches the discovered vocabulary plus the evergreen floor, returns 6 to 10 dated evidence items. Mouth-as-context, not dentistry.
4. `POST /api/cluster { market, items, pulse }` — no search. Clusters the currency-tagged evidence into 3 tensions and 5 expressions with gates and citation ids; the pulse rides along as cultural weather.

`POST /api/culture` and `POST /api/probe` are unchanged (culture map and unbranded probe brief, on demand).

Every search query carries the current month and year, computed at runtime. Search passes prefer sources dated within 30 days; undatable material is admissible only with a visible LOW CONFIDENCE badge. Every user-facing item shows its source and date. The format passes may never introduce a name, date or fact absent from the search notes.

## Setup

### Zero-key quickstart

```
npm install
npm i -g vercel
# set ANTHROPIC_API_KEY in .env or the shell
vercel dev
```

`vercel dev` runs the Vite front end and the serverless functions together. Plain `npm run dev` serves the UI only and every `/api/*` call 404s.

The one required variable:

- `ANTHROPIC_API_KEY` from console.anthropic.com. Used by every stage; web search is billed per search, a full scan is roughly 12 to 16 searches plus tokens.

### Optional keys (collector enrichment)

The Reddit / YouTube collectors survive as an optional enrichment layer. When present they merge real comments into the cluster evidence as the strongest receipts; when absent the scan runs on search alone and the UI shows a quiet "collectors offline" line.

- `YOUTUBE_API_KEY` — Google Cloud, enable YouTube Data API v3. If the key is restricted to HTTP referrers or IPs it will be rejected server-side; set application restrictions to None.
- `REDDIT_USER_AGENT` — Reddit's public JSON API is keyless but needs a descriptive user agent, e.g. `web:loudmouth:v4.0 (by /u/yourusername)`. Reddit blocks many datacenter IPs, so the collector is reliable from local dev and best-effort on deployed hosts.
- `MODEL` — optional, defaults to `claude-sonnet-4-6`.

### Deploy

Push to GitHub, import in Vercel, set `ANTHROPIC_API_KEY` (plus any optional keys), deploy. `vercel.json` sets `maxDuration: 60`. Vercel applies env vars only on new deployments, so redeploy after adding them.

The UI password is `mouth2026`, set in `src/App.jsx`. Client-side gating in the usual internal-tool style, not security.

## Demo mode

A **DEMO DATA** button loads a fully canned dataset per market (in `src/demoData.js`) with no keys and no network: vocabulary, pulse, tensions, expressions, receipts, culture map and probe brief. It is illustrative sample content, clearly banded as DEMO throughout and never passed off as live. Use it to rehearse the UI or when a live source is unavailable.

## Honest limits

- Web search reads the indexed internet. It cannot see inside TikTok or private communities. The pulse and vocabulary layers make the tool feel live; the optional collectors, when keyed, restore true comment-layer honesty.
- Memes will reliably be "this week", not "this morning". Tracks are genuinely current because charts are published data. The UI does not overclaim.
- Culture map specimens come from live web search. The pipeline is instructed never to invent names and to skip empty categories, but verify every name before it goes near a deck.
- No caching yet. Every scan runs live searches. Caching harvests per `market:date` is the highest-value next fix, for both cost and demo latency.

## House rules

No em dashes anywhere. UK English. No adspeak. Dark ground, glass cards, Fraunces display, Space Grotesk UI, JetBrains Mono for data. Status colours: certified `#3DDC97`, probe/warning `#FFB020`, killed `#FF6B6B`, culture `#C792EA`, structure `#6EA8FF`. Prompts are load-bearing product; the anti-fabrication guards must survive every edit. When something fails or degrades, the UI says so, never quietly.
