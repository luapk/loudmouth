import { redditGet, youtubeGet, MARKET_CONFIG, trim } from "./_lib.js";

/*
  GET /api/harvest?market=UK
  Optional enrichment, demoted from the required path in v4. When Reddit
  (keyless) or YouTube (keyed) return anything, their items merge into the
  cluster evidence as the strongest receipts, since they are real comments.
  When they return nothing, this endpoint still responds 200 with an empty
  list and notes, so the client can proceed on the search harvest alone and
  show a single quiet "collectors offline" line. Never fatal.
*/

// Collector queries are derived from the priors, one hint per currency, so
// the old hard-coded query arrays are gone with the rest of v3's fixed lexicon.
function collectorQueries(cfg) {
  return Object.values(cfg.priors)
    .map((p) => p.hints[0])
    .filter(Boolean);
}

async function harvestReddit(cfg, queries) {
  const searches = await Promise.all(
    queries.map((q) =>
      redditGet(
        `/r/${cfg.subs}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&t=month&limit=6&raw_json=1`
      )
        .then((listing) => ({ listing }))
        .catch((e) => ({ error: e.message }))
    )
  );
  const ok = searches.filter((s) => s.listing);
  if (!ok.length) throw new Error(searches.find((s) => s.error)?.error || "all Reddit searches returned nothing");

  const out = [];
  ok.forEach(({ listing }) => {
    (listing.data?.children || []).forEach((c) => {
      const d = c.data;
      if (!d || d.stickied || (!d.title && !d.selftext)) return;
      out.push({
        text: trim(`${d.title}. ${d.selftext || ""}`, 240),
        source: `Reddit r/${d.subreddit}`,
        url: `https://www.reddit.com${d.permalink}`,
        date: "undated",
        confidence: "low",
      });
    });
  });
  return out.slice(0, 12);
}

async function harvestYouTube(cfg, queries) {
  if (!process.env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not set");
  const searches = await Promise.all(
    queries.map((q) =>
      youtubeGet("search", {
        part: "snippet",
        q,
        type: "video",
        maxResults: 3,
        regionCode: cfg.region,
        relevanceLanguage: cfg.lang,
        order: "relevance",
      })
        .then((res) => ({ res }))
        .catch((e) => ({ error: e.message }))
    )
  );
  const ok = searches.filter((s) => s.res);
  if (!ok.length) throw new Error(searches.find((s) => s.error)?.error || "all YouTube searches returned nothing");

  const videos = [];
  ok.forEach(({ res }) => {
    (res?.items || []).slice(0, 2).forEach((v) => {
      if (v?.id?.videoId) videos.push({ id: v.id.videoId, title: v.snippet?.title || "" });
    });
  });

  const commentSets = await Promise.all(
    videos.map((v) =>
      youtubeGet("commentThreads", { part: "snippet", videoId: v.id, maxResults: 6, order: "relevance", textFormat: "plainText" })
        .then((j) => ({ video: v, items: j.items || [] }))
        .catch(() => null)
    )
  );

  const out = [];
  commentSets.forEach((set) => {
    if (!set) return;
    set.items.forEach((t) => {
      const s = t?.snippet?.topLevelComment?.snippet;
      if (!s?.textDisplay) return;
      out.push({
        text: trim(s.textDisplay, 240),
        source: `YouTube: ${trim(set.video.title, 50)}`,
        url: `https://www.youtube.com/watch?v=${set.video.id}&lc=${t.id}`,
        date: s.publishedAt ? s.publishedAt.slice(0, 10) : "undated",
        confidence: s.publishedAt ? "high" : "low",
      });
    });
  });
  return out;
}

export default async function handler(req, res) {
  try {
    const market = (req.query.market || "UK").toUpperCase();
    const cfg = MARKET_CONFIG[market];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });

    const queries = collectorQueries(cfg);
    const [reddit, youtube] = await Promise.allSettled([harvestReddit(cfg, queries), harvestYouTube(cfg, queries)]);

    const notes = [];
    let items = [];
    if (reddit.status === "fulfilled") items = items.concat(reddit.value);
    else notes.push(`Reddit offline: ${reddit.reason.message}`);
    if (youtube.status === "fulfilled") items = items.concat(youtube.value);
    else notes.push(`YouTube offline: ${youtube.reason.message}`);

    // Always 200: this layer is optional, so an empty result is a valid state,
    // not an error. The client decides whether collectors contributed.
    res.status(200).json({ market, ran: items.length > 0, count: items.length, notes, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
