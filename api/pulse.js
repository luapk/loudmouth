import { claude, extractJSON, webSearchTool, logSearch, stamp, MARKET_CONFIG, CHART_SOURCES } from "./_lib.js";

/*
  POST /api/pulse { market, job? }
  Stage 2. job "tracks" or "memes" runs just that job (the client calls both
  in parallel so each invocation stays fast). No job runs both. Everything
  carries source, date and a confidence flag, and the format pass may not
  invent a title, artist, meme or date.
*/

async function doTracks(cfg, month, year) {
  const searchPrompt = `You are LOUDMOUTH's culture pulse for ${cfg.label}, ${month} ${year}. Find the top 5 songs currently charting in ${cfg.label} this week. Use these chart sources by name and cross-reference at least two: ${cfg.pulseSources}. General pinned sources: ${CHART_SOURCES}. Shazam matters because it measures active curiosity. Flag any track riding a TikTok sound.

Run up to two searches. Every query includes "${month} ${year}". Prefer material dated within 14 days.

Return terse dated field notes only, one track per line: title, artist, which chart sources confirmed it, date, any cultural context. Only real, found tracks. Never invent a title, artist or date. If unconfirmed, say so and mark low confidence.`;

  const notes = await claude({ prompt: searchPrompt, tools: webSearchTool(2), maxTokens: 1400, timeoutMs: 42000 });
  const formatPrompt = `Convert these track notes for ${cfg.label} into JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"tracks":[{"title":"...","artist":"...","source":"...","url":"... or empty","date":"...","context":"max 14 words or empty","confidence":"high or low"}]}

Rules: up to 5 tracks. Use ONLY items in the notes, never invent. confidence "high" only if two sources agree or dated within 14 days, else "low". Every item carries source and date; unknown date is "undated" with confidence "low". Compact JSON, no trailing commas.`;

  const raw = await claude({ prompt: formatPrompt, maxTokens: 1200 });
  return extractJSON(raw).tracks || [];
}

async function doMemes(cfg, month, year, pressLine) {
  const searchPrompt = `You are LOUDMOUTH's culture pulse for ${cfg.label}, ${month} ${year}. Find the top 3 memes currently live in ${cfg.label}. Use KnowYourMeme trending plus ${pressLine}.

Run up to two searches. Every query includes "${month} ${year}". Prefer material dated within 14 days.

Return terse dated field notes only, one meme per line: name, one line description, platform, source, date. Only real, found memes. Never invent a meme or date. If unconfirmed, mark low confidence.`;

  const notes = await claude({ prompt: searchPrompt, tools: webSearchTool(2), maxTokens: 1200, timeoutMs: 42000 });
  const formatPrompt = `Convert these meme notes for ${cfg.label} into JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"memes":[{"name":"...","description":"max 14 words","platform":"...","source":"...","url":"... or empty","date":"...","confidence":"high or low"}]}

Rules: up to 3 memes. Use ONLY items in the notes, never invent. confidence "high" only if dated within 14 days, else "low". Every item carries source and date; unknown date is "undated" with confidence "low". Compact JSON, no trailing commas.`;

  const raw = await claude({ prompt: formatPrompt, maxTokens: 1000 });
  return extractJSON(raw).memes || [];
}

export default async function handler(req, res) {
  try {
    const { market, job } = req.body || {};
    const key = (market || "").toUpperCase();
    const cfg = MARKET_CONFIG[key];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });
    const { month, year } = stamp();
    const which = (job || "").toLowerCase();

    const out = { market: key };
    if (which !== "memes") {
      logSearch("pulse:tracks", key, 2);
      out.tracks = await doTracks(cfg, month, year);
    }
    if (which !== "tracks") {
      const pressLine = cfg.press.length ? cfg.press.join(", ") : "the market's Gen Z trend press, which you should identify";
      logSearch("pulse:memes", key, 2);
      out.memes = await doMemes(cfg, month, year, pressLine);
    }
    res.status(200).json(out);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
