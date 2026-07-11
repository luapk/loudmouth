import { claude, extractJSON, webSearchTool, logSearch, stamp, MARKET_CONFIG, CURRENCY_DEFS, CURRENCIES } from "./_lib.js";

/*
  POST /api/discover { market }
  Stage 1. One search per currency (4 total). Teaches itself this month's
  live vocabulary per currency in the market's language. Two-pass: a search
  pass returning dated field notes, then a no-tools format pass that may not
  introduce any term absent from the notes.
*/
export default async function handler(req, res) {
  try {
    const { market } = req.body || {};
    const key = (market || "").toUpperCase();
    const cfg = MARKET_CONFIG[key];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });
    const { month, year } = stamp();

    const hintBlock = CURRENCIES.map(
      (c) => `${c} (${CURRENCY_DEFS[c]}). Priors you may use, extend or overrule: ${cfg.priors[c].hints.join(", ")}.`
    ).join("\n");
    const pressLine = cfg.press.length
      ? `Known Gen Z observer press for ${cfg.label}: ${cfg.press.join(", ")}.`
      : `No press is pre-listed for ${cfg.label}: identify its Gen Z trend press yourself and note what you find.`;

    logSearch("discover", key, 4);
    const searchPrompt = `You are LOUDMOUTH's discovery pass for ${cfg.label}, ${month} ${year}. Find the CURRENT language of Gen Z health-in-culture across four currencies, in the local language and register, as it is used right now. Treat the mouth as the organ of speech, appetite, intimacy and performance, not hygiene. No dentistry, no toothbrush marketing.

${hintBlock}

${pressLine}

Run up to four searches, one per currency. Every query must include "${month} ${year}" or at least "${year}". Prefer sources dated within 30 days.

Return terse dated field notes only, grouped by currency code. For each currency, 4 to 8 live terms or phrases in ${cfg.label}'s language, each on its own line as "CODE: term, one line on why it is current now, source or date if known". Only terms you actually found or confirmed current. Never invent a term. If a currency is thin, return fewer, never padding.`;

    const notes = await claude({ prompt: searchPrompt, tools: webSearchTool(4), maxTokens: 1800 });

    const formatPrompt = `Convert these discovery field notes into LOUDMOUTH vocabulary JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"vocabulary":{"AES":[{"term":"...","note":"max 12 words"}],"DAT":[...],"EMO":[...],"ECO":[...]}}

Rules: use ONLY terms present in the notes, never add new ones. 4 to 8 items per currency where the notes support it, fewer if not. Keep terms in the local language. Every currency key must be present even if its array is empty. Compact JSON, no trailing commas.`;

    const raw = await claude({ prompt: formatPrompt, maxTokens: 1500 });
    const parsed = extractJSON(raw);
    if (!parsed.vocabulary) throw new Error("Malformed discovery output");
    for (const c of CURRENCIES) if (!Array.isArray(parsed.vocabulary[c])) parsed.vocabulary[c] = [];
    res.status(200).json({ market: key, vocabulary: parsed.vocabulary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
