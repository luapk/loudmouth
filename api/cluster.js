import { claude, extractJSON, MARKET_CONFIG } from "./_lib.js";

/*
  POST /api/cluster { market, items }
  One Claude call turns real harvested evidence into the two-speed
  LOUDMOUTH structure. Every expression must cite evidence ids,
  which is what makes the output receipts rather than vibes.
*/
export default async function handler(req, res) {
  try {
    const { market, items } = req.body || {};
    const cfg = MARKET_CONFIG[(market || "").toUpperCase()];
    if (!cfg) return res.status(400).json({ error: "Unknown market" });
    if (!items || !items.length) return res.status(400).json({ error: "No evidence supplied" });

    const evidence = items
      .slice(0, 60)
      .map((i) => `[${i.id}] (${i.source} ${i.kind}, ${i.ctx}, score ${i.score}) ${i.text}`)
      .join("\n");

    const prompt = `You are LOUDMOUTH, a cultural sensing engine for Oral-B's Gen Z health positioning. The product: the affordable iO electric brush as the cheapest health tech you will own. Product truths for the sensor gate: pressure sensor, 2-minute timer, app score, sub-50 price.

Below is REAL evidence harvested from ${cfg.label} communities. Each line has an id. Reddit is the honesty layer, YouTube comments are the reaction layer.

${evidence}

Health for Gen Z means four currencies: AES (aesthetic), DAT (data/tracking), EMO (emotional/mental), ECO (economic/afford).

Cluster this evidence into stable tensions (hold for years) and live expressions (current behaviours). Ground everything in the evidence given, not in general knowledge. Use the market's own register. Set each expression's platform to the source platform of its strongest evidence.

Return ONLY valid JSON, no preamble, no fences:
{"tensions":[{"id":"T1","name":"max 4 words","collision":"X x Y","currencies":["EMO"],"note":"max 22 words, grounded in the evidence"}],"expressions":[{"title":"max 6 words","platform":"Reddit","velocity":3,"tensionId":"T1","summary":"max 20 words describing the observed behaviour","expiry":"Qx 202x","currencyGate":true,"sensorGate":false,"sensorAngle":"max 14 words","evidenceIds":["E1","E2"]}]}

Rules: platform is Reddit or YouTube, matching the strongest evidence. exactly 3 tensions, exactly 5 expressions, velocity integer 1 to 5. evidenceIds: 1 to 3 ids per expression, ONLY ids that appear above and directly support it. sensorGate true ONLY if a product truth directly answers the behaviour. At least one expression must fail a gate. Compact JSON, no trailing commas.`;

    const raw = await claude({ prompt, maxTokens: 2500 });
    const parsed = extractJSON(raw);
    if (!parsed.tensions || !parsed.expressions) throw new Error("Malformed cluster output");
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
