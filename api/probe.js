import { claude, extractJSON, MARKET_CONFIG } from "./_lib.js";

/*
  POST /api/probe { market, expression }
  Writes the unbranded validation brief: cheap organic content from
  non-brand accounts, posted before any creative spend, whose
  performance certifies or kills the insight.
*/
export default async function handler(req, res) {
  try {
    const { market, expression } = req.body || {};
    const cfg = MARKET_CONFIG[(market || "").toUpperCase()];
    if (!cfg || !expression) return res.status(400).json({ error: "Missing market or expression" });

    const prompt = `You are a creative director writing an UNBRANDED probe brief. We validate cultural insights with cheap organic content from non-brand accounts before creative spend.

Market: ${cfg.label}. Expression: "${expression.title}". Behaviour: ${expression.summary}. Product bridge (hidden in the probe, informs angle only): ${expression.sensorAngle}.

Return ONLY valid JSON, no fences:
{"hook":"the first 2 seconds, max 14 words","format":"the native format, max 10 words","creator":"who posts it, max 10 words","caption":"the caption, max 16 words, platform-native register, no hashtag spam","success":"the one signal that certifies the insight, max 14 words"}

No brand mention anywhere. No adspeak. Write like the platform, not like an agency. Use the market's own language where natural.`;

    const raw = await claude({ prompt, maxTokens: 800 });
    const parsed = extractJSON(raw);
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
