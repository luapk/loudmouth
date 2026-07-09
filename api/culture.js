import { claude, extractJSON, MARKET_CONFIG } from "./_lib.js";

/*
  POST /api/culture { market, expression }
  Two-pass: web search returns verified field notes, a clean call
  formats them. The format pass may not introduce names that were
  not in the notes, which is the hallucination guard.
*/
export default async function handler(req, res) {
  try {
    const { market, expression } = req.body || {};
    const cfg = MARKET_CONFIG[(market || "").toUpperCase()];
    if (!cfg || !expression) return res.status(400).json({ error: "Missing market or expression" });

    const hints = {
      UK: "grime and UK rap, Love Island discourse, football culture, BBC and Channel 4 youth output",
      US: "looksmaxxing spaces, hip hop, sneaker and streetwear culture, reality TV, wellness podcasts",
      DE: "Berlin club culture and techno, Deutschrap, festival circuit, Spaeti culture",
      FR: "French rap and clash culture, cafe culture, French pharmacy beauty, cinema",
      ES: "reggaeton and urbano, late night culture, football, Operacion Triunfo era formats",
      IT: "trap italiano, Sanremo discourse, nonna formats, Milan fashion, aperitivo culture",
    };

    const searchPrompt = `Find real, current ${cfg.label} Gen Z cultural specimens that exemplify this signal: "${expression.title}". The behaviour: ${expression.summary}

Search for named examples across: creators or influencers, music artists or scenes, fashion brands or styles, film or TV, live events or viral moments. Local starting points worth checking: ${hints[(market || "").toUpperCase()] || "local youth culture"}. Run 2 to 3 searches maximum. ${cfg.label} specimens strongly preferred over global ones.

Return terse numbered field notes only: up to 12 lines, each under 16 words, format "CATEGORY: real name, what it is, link to the signal". Real names only, only from your search results. If a category turns up nothing real, skip it. Never invent a name.`;

    const notes = await claude({
      prompt: searchPrompt,
      maxTokens: 1500,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }],
    });

    const formatPrompt = `Convert these verified field notes into LOUDMOUTH's culture map JSON.

Field notes:
${notes}

Return ONLY valid JSON, no fences:
{"categories":[{"cat":"CREATORS","items":[{"name":"real name","detail":"what it is, max 9 words","why":"link to the signal, max 12 words"}]}]}

Rules: cat must be one of CREATORS, MUSIC, FASHION, SCREEN, MOMENTS. Include only categories present in the notes. 1 to 2 items per category. Only names from the notes, never add new ones. Compact JSON, no trailing commas.`;

    const raw = await claude({ prompt: formatPrompt, maxTokens: 1200 });
    const parsed = extractJSON(raw);
    if (!parsed.categories || !parsed.categories.length) throw new Error("Empty culture map");
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
