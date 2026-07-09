import { redditGet, MARKET_CONFIG, trim } from "./_lib.js";

/*
  GET /api/harvest?market=UK
  Keyless Reddit harvest. Reddit is the honesty layer: real posts and the
  top comments from the loudest threads, pulled from the public .json API
  with no OAuth app or credentials. YouTube and TikTok are off for now and
  are recoverable from git history. Returns a flat evidence list with
  stable ids, sources and permalinks.
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

export default async function handler(req, res) {
  try {
    const market = (req.query.market || "UK").toUpperCase();
    const cfg = MARKET_CONFIG[market];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });

    const notes = [];
    let reddit = [];
    try {
      reddit = await harvestReddit(cfg);
    } catch (e) {
      notes.push(`Reddit failed: ${e.message}`);
    }

    let n = 0;
    const items = reddit.map((i) => ({ id: `E${++n}`, ...i }));

    if (!items.length) {
      return res.status(502).json({
        error: `No evidence from Reddit. ${notes.join(" · ") || "The public API returned nothing this time."} Reddit is the only source while YouTube and TikTok are off. If this is a deployed host, Reddit may be blocking the datacenter IP; running locally with vercel dev usually works.`,
      });
    }

    res.status(200).json({
      market,
      counts: { reddit: reddit.length },
      notes,
      items,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
