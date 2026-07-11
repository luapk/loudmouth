import { claude, extractJSON, MARKET_CONFIG, PRODUCT_TRUTHS } from "./_lib.js";

/*
  POST /api/cluster { market, items, pulse }
  Stage 4. No search. Turns the currency-tagged sweep evidence (plus any
  optional collector items already merged and id'd by the client) into the
  two-speed structure. The pulse is cultural weather: context for framing,
  citable only if genuinely connected. Each expression must cite evidence
  ids and inherits the currency of its strongest evidence. At least one
  expression must fail a gate: the kill rate is a KPI, not a defect.
*/
export default async function handler(req, res) {
  try {
    const { market, items, pulse } = req.body || {};
    const cfg = MARKET_CONFIG[(market || "").toUpperCase()];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });
    if (!items || !items.length) return res.status(400).json({ error: "No evidence supplied" });

    const evidence = items
      .slice(0, 80)
      .map((i) => `[${i.id}] (${i.currency || "?"}, ${i.source || "source"}, ${i.date || "undated"}) ${i.text}`)
      .join("\n");

    const weatherBits = [];
    if (pulse?.tracks?.length) weatherBits.push("Charting now: " + pulse.tracks.map((t) => `${t.title} by ${t.artist}`).join("; "));
    if (pulse?.memes?.length) weatherBits.push("Live memes: " + pulse.memes.map((m) => m.name).join("; "));
    const weather = weatherBits.join("\n");

    const prompt = `You are LOUDMOUTH, a cultural sensing engine for Oral-B's Gen Z health positioning. The product: the affordable iO electric brush as the cheapest health tech you will own. Product truths for the sensor gate: ${PRODUCT_TRUTHS}.

Below is REAL evidence harvested for ${cfg.label} by live web search, each line tagged with its currency (AES, DAT, EMO, ECO), source and date.

${evidence}

${weather ? `CULTURAL WEATHER (context only, cite an item only if genuinely connected):\n${weather}\n\n` : ""}Health for Gen Z means four currencies: AES (aesthetic), DAT (data/tracking), EMO (emotional/mental), ECO (economic/afford).

Cluster this evidence into stable tensions (hold for years) and live expressions (current behaviours). Ground everything in the evidence given, not general knowledge. Use the market's own register. Each expression inherits the currency tag of its strongest evidence.

Return ONLY valid JSON, no preamble, no fences:
{"tensions":[{"id":"T1","name":"max 4 words","collision":"X x Y","currencies":["EMO"],"note":"max 22 words, grounded in the evidence"}],"expressions":[{"title":"max 6 words","platform":"web","velocity":3,"tensionId":"T1","summary":"max 20 words describing the observed behaviour","expiry":"Qx 202x","currency":"EMO","currencyGate":true,"sensorGate":false,"sensorAngle":"max 14 words","evidenceIds":["E1","E2"]}]}

Rules: exactly 3 tensions, exactly 5 expressions, velocity integer 1 to 5. currency is one of AES DAT EMO ECO, matching the strongest evidence. evidenceIds: 1 to 3 ids that appear above and directly support it. sensorGate true ONLY if a product truth directly answers the behaviour. At least one expression must fail a gate. Compact JSON, no trailing commas.`;

    const raw = await claude({ prompt, maxTokens: 2500 });
    const parsed = extractJSON(raw);
    if (!parsed.tensions || !parsed.expressions) throw new Error("Malformed cluster output");
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
