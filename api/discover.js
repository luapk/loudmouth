import { claude, extractJSON, webSearchTool, logSearch, stamp, MARKET_CONFIG, CURRENCY_DEFS, CURRENCIES } from "./_lib.js";

/*
  POST /api/discover { market, currency? }
  Stage 1. Teaches itself this month's live vocabulary. Called once per
  currency by the client so each invocation runs a single search and stays
  well inside the 60s function limit. If no currency is given it does all
  four (kept for convenience). Two-pass: a search pass returning dated field
  notes, then a no-tools format pass that may not introduce any term absent
  from the notes.
*/

async function discoverCurrency(cfg, c, month, year, pressLine) {
  const searchPrompt = `You are LOUDMOUTH's discovery pass for ${cfg.label}, ${month} ${year}. Find the CURRENT language of the ${c} currency of Gen Z health-in-culture, in the local language and register, as it is used right now.

${c} means ${CURRENCY_DEFS[c]}. Treat the mouth as the organ of speech, appetite, intimacy and performance, not hygiene. No dentistry, no toothbrush marketing.

Priors you may use, extend or overrule: ${cfg.priors[c].hints.join(", ")}.
${pressLine}

Run one search. The query must include "${month} ${year}" or at least "${year}". Prefer sources dated within 30 days.

Return terse dated field notes only: 4 to 8 live terms or phrases in ${cfg.label}'s language, each on its own line as "term, one line on why it is current now, source or date if known". Only terms you actually found or confirmed current. Never invent a term. If thin, return fewer, never padding.`;

  const notes = await claude({ prompt: searchPrompt, tools: webSearchTool(1), maxTokens: 900, timeoutMs: 42000 });

  const formatPrompt = `Convert these ${c} discovery notes for ${cfg.label} into JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"terms":[{"term":"...","note":"max 12 words"}]}

Rules: use ONLY terms present in the notes, never add new ones. 4 to 8 items where the notes support it, fewer if not. Keep terms in the local language. Compact JSON, no trailing commas.`;

  const raw = await claude({ prompt: formatPrompt, maxTokens: 700 });
  const parsed = extractJSON(raw);
  return Array.isArray(parsed.terms) ? parsed.terms : [];
}

export default async function handler(req, res) {
  try {
    const { market, currency } = req.body || {};
    const key = (market || "").toUpperCase();
    const cfg = MARKET_CONFIG[key];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });

    const targets = currency ? [currency.toUpperCase()] : CURRENCIES;
    for (const c of targets) if (!CURRENCY_DEFS[c]) return res.status(400).json({ error: `Unknown currency ${c}` });

    const pressLine = cfg.press.length
      ? `Known Gen Z observer press for ${cfg.label}: ${cfg.press.join(", ")}.`
      : `No press is pre-listed for ${cfg.label}: identify its Gen Z trend press yourself and note what you find.`;
    const { month, year } = stamp();

    logSearch("discover", `${key}:${targets.join(",")}`, targets.length);
    const results = await Promise.all(targets.map((c) => discoverCurrency(cfg, c, month, year, pressLine).catch(() => [])));

    const vocabulary = {};
    targets.forEach((c, i) => (vocabulary[c] = results[i]));
    res.status(200).json({ market: key, vocabulary });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
