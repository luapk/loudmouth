import { redditGet, youtubeGet, MARKET_CONFIG, trim } from "./_lib.js";

/*
  GET /api/harvest?market=UK
  Two collectors run in parallel, each failing independently:
  Reddit (honesty layer, keyless public API) and YouTube comments
  (reaction layer, Data API v3). TikTok is off for now. A single source
  failing is non-fatal and surfaces as a note; only an all-empty result
  errors the scan. Returns a flat evidence list with stable ids.
*/

async function harvestReddit(cfg) {
  // Keep a per-query error so a total failure (e.g. an IP-blocked cloud
  // host) surfaces as a note instead of a silent empty layer, while a
  // single failed query still degrades gracefully.
  const searches = await Promise.all(
    cfg.queries.map((q) =>
      redditGet(
        `/r/${cfg.subs}/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&t=year&limit=6&raw_json=1`
      )
        .then((listing) => ({ q, listing }))
        .catch((e) => ({ q, error: e.message }))
    )
  );

  const ok = searches.filter((s) => s.listing);
  if (!ok.length) {
    const reason = searches.find((s) => s.error)?.error || "all Reddit searches returned nothing";
    throw new Error(reason);
  }

  const posts = [];
  ok.forEach(({ q, listing }) => {
    (listing.data?.children || []).forEach((c) => {
      const d = c.data;
      if (!d || d.stickied) return;
      posts.push({
        query: q,
        id: d.id,
        sub: d.subreddit,
        title: d.title,
        selftext: d.selftext,
        score: d.score,
        num_comments: d.num_comments,
        permalink: `https://www.reddit.com${d.permalink}`,
      });
    });
  });

  const byQuery = {};
  posts.forEach((p) => {
    byQuery[p.query] = byQuery[p.query] || [];
    byQuery[p.query].push(p);
  });
  const threadTargets = Object.values(byQuery).flatMap((arr) =>
    arr.sort((a, b) => b.num_comments - a.num_comments).slice(0, 2)
  );

  const commentSets = await Promise.all(
    threadTargets.map((p) =>
      redditGet(`/comments/${p.id}.json?limit=12&depth=1&sort=top&raw_json=1`)
        .then((j) => ({ post: p, listing: j }))
        .catch(() => null)
    )
  );

  const out = [];
  posts.slice(0, 15).forEach((p) => {
    if (!p.title && !p.selftext) return;
    out.push({
      source: "reddit",
      kind: "post",
      ctx: `r/${p.sub}`,
      text: trim(`${p.title}. ${p.selftext || ""}`, 300),
      score: p.score,
      permalink: p.permalink,
    });
  });
  commentSets.forEach((set) => {
    if (!set) return;
    const comments = set.listing?.[1]?.data?.children || [];
    comments.slice(0, 5).forEach((c) => {
      const d = c.data;
      if (!d || !d.body || d.body === "[deleted]" || d.body === "[removed]") return;
      out.push({
        source: "reddit",
        kind: "comment",
        ctx: `r/${d.subreddit}`,
        text: trim(d.body, 300),
        score: d.score,
        permalink: `https://www.reddit.com${d.permalink}`,
      });
    });
  });
  return out;
}

async function harvestYouTube(cfg) {
  if (!process.env.YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY is not set");

  const searches = await Promise.all(
    cfg.queries.map((q) =>
      youtubeGet("search", {
        part: "snippet",
        q: q.replace(/ OR /g, " | "),
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
  if (!ok.length) {
    const reason = searches.find((s) => s.error)?.error || "all YouTube searches returned nothing";
    throw new Error(reason);
  }

  const videos = [];
  ok.forEach(({ res }) => {
    (res?.items || []).slice(0, 2).forEach((v) => {
      if (v?.id?.videoId) {
        videos.push({
          id: v.id.videoId,
          title: v.snippet?.title || "",
          channel: v.snippet?.channelTitle || "YouTube",
        });
      }
    });
  });

  const commentSets = await Promise.all(
    videos.map((v) =>
      youtubeGet("commentThreads", {
        part: "snippet",
        videoId: v.id,
        maxResults: 6,
        order: "relevance",
        textFormat: "plainText",
      })
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
        source: "youtube",
        kind: "comment",
        ctx: trim(set.video.title, 60),
        text: trim(s.textDisplay, 300),
        score: s.likeCount || 0,
        permalink: `https://www.youtube.com/watch?v=${set.video.id}&lc=${t.id}`,
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

    const [reddit, youtube] = await Promise.allSettled([harvestReddit(cfg), harvestYouTube(cfg)]);

    const notes = [];
    const src = { reddit: [], youtube: [] };
    if (reddit.status === "fulfilled") src.reddit = reddit.value;
    else notes.push(`Reddit skipped: ${reddit.reason.message}`);
    if (youtube.status === "fulfilled") src.youtube = youtube.value;
    else notes.push(`YouTube skipped: ${youtube.reason.message}`);

    let n = 0;
    const items = [...src.reddit, ...src.youtube].map((i) => ({ id: `E${++n}`, ...i }));

    if (!items.length) {
      return res.status(502).json({
        error: `No evidence from any source. ${notes.join(" · ")}`,
      });
    }

    res.status(200).json({
      market,
      counts: { reddit: src.reddit.length, youtube: src.youtube.length },
      notes,
      items,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
