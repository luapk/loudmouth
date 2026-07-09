import { getRedditToken, redditGet, youtubeGet, tiktokTrends, MARKET_CONFIG, trim } from "./_lib.js";

/*
  GET /api/harvest?market=UK
  Three collectors run in parallel, each failing independently:
  Reddit (honesty layer), YouTube comments (reaction layer),
  TikTok Creative Center trends (cultural weather). Returns a flat
  evidence list with stable ids, sources and permalinks.
*/

async function harvestReddit(cfg) {
  // Authenticate up front so missing credentials or a rejected auth reject
  // this collector and surface as a note, rather than being swallowed by the
  // per-query catches below and leaving the source silently empty.
  await getRedditToken();

  const searches = await Promise.all(
    cfg.queries.map((q) =>
      redditGet(
        `/r/${cfg.subs}/search?q=${encodeURIComponent(q)}&restrict_sr=1&sort=relevance&t=year&limit=6&raw_json=1`
      ).catch(() => null)
    )
  );

  const posts = [];
  searches.forEach((listing, qi) => {
    if (!listing) return;
    (listing.data?.children || []).forEach((c) => {
      const d = c.data;
      if (!d || d.stickied) return;
      posts.push({
        query: cfg.queries[qi],
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
      redditGet(`/comments/${p.id}?limit=12&depth=1&sort=top&raw_json=1`)
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
  // YouTube is optional, but a missing key should say so in the amber strip
  // rather than degrade to an unexplained empty layer.
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
      }).catch(() => null)
    )
  );

  const videos = [];
  searches.forEach((res) => {
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

async function harvestTikTok(cfg) {
  const list = await tiktokTrends(cfg.tiktok);
  return list.slice(0, 15).map((h) => ({
    source: "tiktok",
    kind: "trend",
    ctx: "trending this week",
    text: trim(
      `#${h.hashtag_name}${h.video_views ? `, ${Number(h.video_views).toLocaleString("en-GB")} views` : ""}${h.publish_cnt ? `, ${Number(h.publish_cnt).toLocaleString("en-GB")} posts` : ""}`,
      200
    ),
    score: h.rank || 0,
    permalink: `https://ads.tiktok.com/business/creativecenter/hashtag/${encodeURIComponent(h.hashtag_name || "")}/pc/en?countryCode=${cfg.tiktok}&period=7`,
  }));
}

export default async function handler(req, res) {
  try {
    const market = (req.query.market || "UK").toUpperCase();
    const cfg = MARKET_CONFIG[market];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });

    const [reddit, youtube, tiktok] = await Promise.allSettled([
      harvestReddit(cfg),
      harvestYouTube(cfg),
      harvestTikTok(cfg),
    ]);

    const notes = [];
    const sourceItems = { reddit: [], youtube: [], tiktok: [] };
    if (reddit.status === "fulfilled") sourceItems.reddit = reddit.value;
    else notes.push(`Reddit skipped: ${reddit.reason.message}`);
    if (youtube.status === "fulfilled") sourceItems.youtube = youtube.value;
    else notes.push(`YouTube skipped: ${youtube.reason.message}`);
    if (tiktok.status === "fulfilled") sourceItems.tiktok = tiktok.value;
    else notes.push(`TikTok skipped: ${tiktok.reason.message}`);

    let n = 0;
    const items = [...sourceItems.reddit, ...sourceItems.youtube, ...sourceItems.tiktok].map(
      (i) => ({ id: `E${++n}`, ...i })
    );

    if (!items.length) {
      return res.status(502).json({ error: `No evidence from any source. ${notes.join(" · ")}` });
    }

    res.status(200).json({
      market,
      counts: {
        reddit: sourceItems.reddit.length,
        youtube: sourceItems.youtube.length,
        tiktok: sourceItems.tiktok.length,
      },
      notes,
      items,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
