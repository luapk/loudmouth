import { tiktokTrends, MARKET_CONFIG, trim } from "./_lib.js";

/*
  GET /api/harvest?market=UK
  TikTok-only harvest. Reddit and YouTube are disabled for now, so the
  sole source is TikTok Creative Center trending hashtags for the market
  this week. These are trending signals, not quotes: they show what is
  loud in the feed, not what any one person said. The cluster step is
  told this plainly so a hashtag is never dressed up as a receipt.
  Reddit and YouTube collectors are recoverable from git history.
*/

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

    const notes = [];
    let trends = [];
    try {
      trends = await harvestTikTok(cfg);
    } catch (e) {
      notes.push(`TikTok failed: ${e.message}`);
    }

    let n = 0;
    const items = trends.map((i) => ({ id: `E${++n}`, ...i }));

    if (!items.length) {
      return res.status(502).json({
        error: `No signal from TikTok. ${notes.join(" · ") || "The Creative Center endpoint returned nothing this time."} TikTok is the only source while Reddit and YouTube are off, so there is no fallback.`,
      });
    }

    res.status(200).json({
      market,
      counts: { tiktok: trends.length },
      notes,
      items,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
