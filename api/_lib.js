/*
  Shared server-side helpers for LOUDMOUTH v4.
  Anthropic API with web search, JSON extraction, freshness helpers, and
  per-market priors. Reddit / YouTube / TikTok collectors survive as an
  optional enrichment layer, demoted from the required path. The only key
  the tool needs is ANTHROPIC_API_KEY.
*/

const UA = process.env.REDDIT_USER_AGENT || "web:loudmouth:v4.0 (cultural sensing prototype)";

/*
  Keyless Reddit. The public .json endpoints need no OAuth app and no
  credentials. Reddit rate-limits unauthenticated traffic and can block
  datacenter IPs, so this is reliable from local dev and best-effort from
  cloud hosting. Used only by the optional collector enrichment now.
*/
export async function redditGet(path) {
  const res = await fetch(`https://www.reddit.com${path}`, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Reddit ${res.status} on ${path}`);
  return res.json();
}

export async function youtubeGet(endpoint, params) {
  // Trim defensively: a trailing newline pasted into the env var is a common
  // cause of an otherwise valid key being rejected.
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  const url = new URL(`https://www.googleapis.com/youtube/v3/${endpoint}`);
  Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) {
    // Surface YouTube's own reason so a 401 or 403 is actionable rather than opaque.
    const body = await res.text();
    let detail = body.slice(0, 160);
    try {
      detail = JSON.parse(body).error?.message || detail;
    } catch {
      // body was not JSON, keep the raw snippet
    }
    throw new Error(`YouTube ${res.status} on ${endpoint}: ${detail}`);
  }
  return res.json();
}

/*
  TikTok Creative Center trending hashtags. Unofficial public endpoint,
  brittle by nature, so callers must treat failure as non-fatal. Optional
  enrichment only.
*/
export async function tiktokTrends(countryCode) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const url = `https://ads.tiktok.com/creative_radar_api/v1/popular_trend/hashtag/list?page=1&limit=20&period=7&country_code=${countryCode}&sort_by=popular`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
        Referer: "https://ads.tiktok.com/business/creativecenter/inspiration/popular/hashtag/pc/en",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`TikTok ${res.status}`);
    const json = await res.json();
    return json?.data?.list || [];
  } finally {
    clearTimeout(timer);
  }
}

/*
  One Claude call. Pass tools to enable the Anthropic web search tool. When
  search is on, the API runs the search loop server-side and we return the
  concatenated text blocks, which is all the two-pass pattern needs.
*/
export async function claude({ prompt, tools, maxTokens = 2000, timeoutMs = 55000 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const body = {
    model: process.env.MODEL || "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (tools) body.tools = tools;
  // Abort before Vercel's 60s function kill so a slow search returns a clean
  // JSON error the client can show, not a platform timeout page. Stages that
  // make two calls (search then format) pass a tighter budget for the search
  // pass so both fit inside the function limit.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === "AbortError") throw new Error(`Anthropic call exceeded ${Math.round(timeoutMs / 1000)}s. The search was too slow for one function; retry, it is usually transient.`);
    throw e;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic ${res.status}: ${err.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/*
  Convenience wrapper for a web search pass. Logs the search budget so scan
  cost is observable server-side, per the handoff's cost discipline.
*/
export function webSearchTool(maxUses) {
  return [{ type: "web_search_20250305", name: "web_search", max_uses: maxUses }];
}

export function logSearch(stage, market, maxUses) {
  console.log(`[loudmouth] search stage=${stage} market=${market} max_uses=${maxUses}`);
}

/*
  Shared scan storage via a Redis REST endpoint (Vercel KV / Upstash). The
  integration injects KV_REST_API_URL and KV_REST_API_TOKEN (or the UPSTASH_
  equivalents). When neither is present the tool simply runs local-only, so
  the zero-config default still holds; sharing switches on the moment a store
  is connected. Commands use the Upstash REST command format.
*/
function kvCreds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

export function kvConfigured() {
  return !!kvCreds();
}

export async function kvCommand(args) {
  const c = kvCreds();
  if (!c) throw new Error("Shared store not configured");
  const res = await fetch(c.url, {
    method: "POST",
    headers: { Authorization: `Bearer ${c.token}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Store ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const json = await res.json();
  return json.result;
}

export function extractJSON(text) {
  const cleaned = text.replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model output");
  const candidate = cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(candidate);
}

// Current month and year, computed at runtime. Never hard-code a date into
// a prompt; every freshness rule reads from here.
export function stamp() {
  const d = new Date();
  return {
    month: d.toLocaleString("en-GB", { month: "long" }),
    year: d.getFullYear(),
    iso: d.toISOString().slice(0, 10),
  };
}

export function trim(s, n) {
  if (!s) return "";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}

// The four currencies of health. Hard-coded strategic spine, never generated.
export const CURRENCIES = ["AES", "DAT", "EMO", "ECO"];

export const CURRENCY_DEFS = {
  AES: "aesthetic: how the mouth looks and is adorned, grillz, tooth gems, smile-makeover culture, veneers discourse",
  DAT: "data and tracking: quantifying the body and mouth, scores, streaks, wearables, self-optimisation",
  EMO: "emotional and mental: the mouth as the organ of speech, anxiety and intimacy, jaw tension, the ick, accents, diction, food-and-eating formats",
  ECO: "economic and affordability: the cost of care, dupes, budget beauty, access and value",
};

// Product truths for the sensor gate. Hard-coded, never generated.
export const PRODUCT_TRUTHS = "pressure sensor, 2-minute timer, app score, sub-50 price";

// Chart sources pinned for all markets. Data infrastructure, not vocabulary.
export const CHART_SOURCES = "Spotify weekly country Top Songs chart, Shazam country chart, kworb.net country data";

/*
  Priors: hints, not walls. Per market, per currency, a few hint terms and a
  hard floor of 2 evergreen queries so a weak discovery degrades to a
  mediocre scan, never an empty one. The discovery pass may use, extend or
  overrule the hints. `press` lists Gen Z observer publications; where it is
  empty the discovery pass is told to identify the market's Gen Z trend
  press itself. Collector fields (subs, region, lang, tiktok) feed the
  optional enrichment layer only.
*/
export const MARKET_CONFIG = {
  UK: {
    label: "United Kingdom",
    lang: "en",
    region: "GB",
    tiktok: "GB",
    subs: "unitedkingdom+CasualUK+AskUK+britishproblems",
    press: ["The Tab", "LADbible trending", "Dazed"],
    pulseSources: "Spotify Weekly Top Songs United Kingdom, Shazam UK, kworb.net UK",
    priors: {
      AES: { hints: ["tooth gems", "grillz", "smile makeover TikTok", "veneers discourse"], floor: ["UK Gen Z mouth aesthetic trend", "British smile beauty trend"] },
      DAT: { hints: ["health tracking app", "streak culture", "wearables Gen Z"], floor: ["Gen Z self-tracking UK trend", "quantified health UK Gen Z"] },
      EMO: { hints: ["jaw clenching anxiety", "the ick discourse", "Chicken Shop Date", "accent and slang discourse"], floor: ["Gen Z anxiety body language UK", "mouth speech culture UK trend"] },
      ECO: { hints: ["NHS dentist crisis", "turkey teeth budget", "dupe culture", "cost of living self-care"], floor: ["Gen Z affordable self-care UK", "budget beauty UK trend"] },
    },
  },
  US: {
    label: "United States",
    lang: "en",
    region: "US",
    tiktok: "US",
    subs: "AskAnAmerican+mildlyinfuriating+Anxiety+dating",
    press: ["KnowYourMeme", "Nylon", "mainstream trend desks"],
    pulseSources: "Spotify Weekly Top Songs USA, Shazam US, kworb.net US",
    priors: {
      AES: { hints: ["grillz", "veneers discourse", "looksmaxxing mouth", "smile filter"], floor: ["Gen Z mouth aesthetic US trend", "US smile beauty trend"] },
      DAT: { hints: ["health tracking app", "streak culture", "Oura and wearables"], floor: ["Gen Z self-tracking US trend", "quantified health US Gen Z"] },
      EMO: { hints: ["jaw clenching anxiety", "the ick discourse", "mukbang", "rap diction and freestyle"], floor: ["Gen Z anxiety body language US", "mouth speech culture US trend"] },
      ECO: { hints: ["dental cost no insurance", "dupe culture", "budget beauty", "loud budgeting"], floor: ["Gen Z affordable self-care US", "budget beauty US trend"] },
    },
  },
  DE: {
    label: "Germany",
    lang: "de",
    region: "DE",
    tiktok: "DE",
    subs: "de+germany+FragReddit",
    press: ["jetzt", "watson"],
    pulseSources: "Spotify Weekly Top Songs Germany, Shazam Germany, kworb.net DE",
    priors: {
      AES: { hints: ["Tooth Gems", "Grillz", "Veneers Diskurs", "Smile Makeover"], floor: ["Gen Z Mund Aesthetik Trend Deutschland", "Laecheln Beauty Trend Deutschland"] },
      DAT: { hints: ["Health Tracking App", "Streak Kultur", "Wearables Gen Z"], floor: ["Gen Z Selbst-Tracking Trend Deutschland", "quantified self Gen Z Deutschland"] },
      EMO: { hints: ["Kiefer Anspannung Angst", "the ick", "Mukbang", "Akzent und Slang Diskurs"], floor: ["Gen Z Angst Koerpersprache Deutschland", "Mund Sprache Kultur Trend Deutschland"] },
      ECO: { hints: ["Zahnarzt Kosten", "Dupe Kultur", "Budget Beauty", "Sparen Selfcare"], floor: ["Gen Z guenstige Selfcare Deutschland", "Budget Beauty Trend Deutschland"] },
    },
  },
  FR: {
    label: "France",
    lang: "fr",
    region: "FR",
    tiktok: "FR",
    subs: "france+AskFrance",
    press: ["Konbini", "Neon"],
    pulseSources: "Spotify Weekly Top Songs France, Shazam France, kworb.net FR",
    priors: {
      AES: { hints: ["tooth gems", "grillz", "facettes dentaires", "smile makeover"], floor: ["tendance esthetique bouche Gen Z France", "tendance beaute sourire France"] },
      DAT: { hints: ["application suivi sante", "culture du streak", "wearables Gen Z"], floor: ["tendance self-tracking Gen Z France", "quantified self Gen Z France"] },
      EMO: { hints: ["machoire serree anxiete", "the ick", "la bise", "diction et punchline rap"], floor: ["Gen Z anxiete langage corporel France", "tendance bouche parole culture France"] },
      ECO: { hints: ["cout dentiste", "culture des dupes", "beaute petit budget", "pouvoir d'achat soin"], floor: ["Gen Z soin abordable France", "tendance beaute petit budget France"] },
    },
  },
  ES: {
    label: "Spain",
    lang: "es",
    region: "ES",
    tiktok: "ES",
    subs: "es+spain+askspain",
    press: [],
    pulseSources: "Spotify Weekly Top Songs Spain, Shazam Spain, kworb.net ES",
    priors: {
      AES: { hints: ["tooth gems", "grillz", "carillas discurso", "smile makeover"], floor: ["tendencia estetica boca Gen Z Espana", "tendencia belleza sonrisa Espana"] },
      DAT: { hints: ["app seguimiento salud", "cultura del streak", "wearables Gen Z"], floor: ["tendencia self-tracking Gen Z Espana", "quantified self Gen Z Espana"] },
      EMO: { hints: ["mandibula apretada ansiedad", "the ick", "sobremesa", "diccion y punchline rap"], floor: ["Gen Z ansiedad lenguaje corporal Espana", "tendencia boca habla cultura Espana"] },
      ECO: { hints: ["coste dentista", "cultura dupe", "belleza low cost", "poder adquisitivo cuidado"], floor: ["Gen Z autocuidado asequible Espana", "tendencia belleza low cost Espana"] },
    },
  },
  IT: {
    label: "Italy",
    lang: "it",
    region: "IT",
    tiktok: "IT",
    subs: "italy+Italia",
    press: ["Webboh"],
    pulseSources: "Spotify Weekly Top Songs Italy, Shazam Italy, kworb.net IT",
    priors: {
      AES: { hints: ["tooth gems", "grillz", "faccette discorso", "smile makeover"], floor: ["tendenza estetica bocca Gen Z Italia", "tendenza bellezza sorriso Italia"] },
      DAT: { hints: ["app monitoraggio salute", "cultura dello streak", "wearables Gen Z"], floor: ["tendenza self-tracking Gen Z Italia", "quantified self Gen Z Italia"] },
      EMO: { hints: ["mascella serrata ansia", "the ick", "rito del caffe espresso", "dizione e punchline rap"], floor: ["Gen Z ansia linguaggio del corpo Italia", "tendenza bocca parola cultura Italia"] },
      ECO: { hints: ["costo dentista", "cultura dupe", "bellezza low cost", "potere d'acquisto cura"], floor: ["Gen Z cura di se accessibile Italia", "tendenza bellezza low cost Italia"] },
    },
  },
};
