import { claude, extractJSON, webSearchTool, logSearch, stamp, MARKET_CONFIG, CHART_SOURCES } from "./_lib.js";

/*
  POST /api/pulse { market }
  Stage 2. Two jobs in one call (max 4 searches): the 5 tracks currently
  charting and the 3 memes currently live. Charts are pinned data sources,
  cross-referenced. Everything carries source, date and a confidence flag.
  Two-pass, and the format pass may not invent a title, artist, meme or date.
*/
export default async function handler(req, res) {
  try {
    const { market } = req.body || {};
    const key = (market || "").toUpperCase();
    const cfg = MARKET_CONFIG[key];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });
    const { month, year } = stamp();
    const pressLine = cfg.press.length ? cfg.press.join(", ") : "the market's Gen Z trend press, which you should identify";

    logSearch("pulse", key, 4);
    const searchPrompt = `You are LOUDMOUTH's culture pulse for ${cfg.label}, ${month} ${year}. Two jobs.

TRACKS: the top 5 songs currently charting in ${cfg.label} this week. Use these chart sources by name and cross-reference at least two: ${cfg.pulseSources}. General pinned sources: ${CHART_SOURCES}. Shazam matters because it measures active curiosity. Flag any track riding a TikTok sound.

MEMES: the top 3 memes currently live in ${cfg.label}. Use KnowYourMeme trending plus ${pressLine}.

Run up to four searches. Every query includes "${month} ${year}". Prefer material dated within 14 days.

Return terse dated field notes only. For each track: title, artist, which chart sources confirmed it, date, any cultural context. For each meme: name, one line description, platform, source, date. Only real, found items. Never invent a title, artist, meme or date. If you cannot confirm something, say so and mark it low confidence.`;

    const notes = await claude({ prompt: searchPrompt, tools: webSearchTool(4), maxTokens: 2000 });

    const formatPrompt = `Convert these culture-pulse field notes into LOUDMOUTH JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"tracks":[{"title":"...","artist":"...","source":"...","url":"... or empty","date":"...","context":"max 14 words or empty","confidence":"high or low"}],"memes":[{"name":"...","description":"max 14 words","platform":"...","source":"...","url":"... or empty","date":"...","confidence":"high or low"}]}

Rules: up to 5 tracks, up to 3 memes. Use ONLY items present in the notes, never invent. confidence is "high" only if two sources agree or the item is dated within 14 days, else "low". Every item must carry source and date; if a date is unknown write "undated" and set confidence "low". Compact JSON, no trailing commas.`;

    const raw = await claude({ prompt: formatPrompt, maxTokens: 1500 });
    const parsed = extractJSON(raw);
    res.status(200).json({ market: key, tracks: parsed.tracks || [], memes: parsed.memes || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
