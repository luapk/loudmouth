import { claude, extractJSON, webSearchTool, logSearch, stamp, MARKET_CONFIG, CURRENCY_DEFS } from "./_lib.js";

/*
  POST /api/sweep { market, currency, vocabulary }
  Stage 3. Called once per currency by the client (four times). Searches the
  discovered vocabulary plus the evergreen floor and returns 6 to 10 dated
  evidence items. Mouth-as-context is enforced: no dentistry, no toothbrush
  content. Two-pass, format pass may not invent text, source, url or date.
*/
export default async function handler(req, res) {
  try {
    const { market, currency, vocabulary } = req.body || {};
    const key = (market || "").toUpperCase();
    const cfg = MARKET_CONFIG[key];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });
    if (!CURRENCY_DEFS[currency]) return res.status(400).json({ error: "Unknown currency" });
    const { month, year } = stamp();

    const floor = cfg.priors[currency].floor;
    const discovered = Array.isArray(vocabulary) ? vocabulary.filter(Boolean) : [];
    const terms = [...discovered, ...floor].slice(0, 8);

    logSearch(`sweep:${currency}`, key, 3);
    const searchPrompt = `You are LOUDMOUTH sweeping the ${currency} currency (${CURRENCY_DEFS[currency]}) in ${cfg.label}, ${month} ${year}. Treat the mouth as culture, not dentistry: speech, appetite, intimacy, performance, adornment, anxiety. Reject toothbrush press releases and dental industry content outright.

Search using this vocabulary and evergreen floor: ${terms.join(" | ")}. Run up to three searches. Every query includes "${month} ${year}". Prefer sources dated within 30 days.

Return 6 to 10 terse dated field notes, one per line as "what was found in max 25 words | source publication or platform | url if known | date". Only real, found material. Never invent a fact, name, date or url. Undatable items are allowed but must say "undated".`;

    const notes = await claude({ prompt: searchPrompt, tools: webSearchTool(3), maxTokens: 2000 });

    const formatPrompt = `Convert these ${currency} sweep notes for ${cfg.label} into LOUDMOUTH evidence JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"items":[{"text":"what was found, max 25 words","source":"publication or platform","url":"... or empty","date":"... or 'undated'","confidence":"high or low"}]}

Rules: 6 to 10 items where the notes support it. Use ONLY material in the notes, never invent text, source, url or date. confidence "high" only if dated within 30 days, else "low". Compact JSON, no trailing commas.`;

    const raw = await claude({ prompt: formatPrompt, maxTokens: 2000 });
    const parsed = extractJSON(raw);
    const items = (parsed.items || []).map((i) => ({ ...i, currency }));
    res.status(200).json({ market: key, currency, items });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
