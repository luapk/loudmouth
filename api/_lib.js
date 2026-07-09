/*
  Shared server-side helpers for LOUDMOUTH v3.
  Reddit OAuth, YouTube Data API, TikTok Creative Center trends,
  Claude API, JSON extraction, and per-market harvest configuration.
*/

const UA = process.env.REDDIT_USER_AGENT || "web:loudmouth:v3.0 (cultural sensing prototype)";

/*
  Keyless Reddit. The public .json endpoints need no OAuth app and no
  credentials, which sidesteps Reddit's app-creation policy gate entirely.
  Pass a path that already ends in .json before its query string. Reddit
  rate-limits unauthenticated traffic and can block datacenter IPs, so this
  is reliable from local dev and best-effort from cloud hosting. A unique,
  descriptive User-Agent is required or Reddit blocks the request.
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
  TikTok Creative Center trending hashtags. Unofficial but public
  endpoint behind the Creative Center site. Brittle by nature, so
  callers must treat failure as non-fatal.
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

export async function claude({ prompt, tools, maxTokens = 2000 }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  const body = {
    model: process.env.MODEL || "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  };
  if (tools) body.tools = tools;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
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

export function extractJSON(text) {
  const cleaned = text.replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in model output");
  const candidate = cleaned.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(candidate);
}

/*
  Harvest configuration. Queries are the mouth-as-context lenses,
  localised per market. Subreddits act as the Reddit market proxy.
  region and lang drive YouTube search, tiktok drives Creative Center.
*/
export const MARKET_CONFIG = {
  UK: {
    label: "United Kingdom",
    subs: "unitedkingdom+CasualUK+AskUK+NHS+britishproblems",
    region: "GB",
    lang: "en",
    tiktok: "GB",
    queries: [
      "jaw clenching OR teeth grinding",
      "NHS dentist appointment",
      "veneers OR turkey teeth",
      "bad breath dating",
      "vape OR nicotine pouches teeth",
    ],
  },
  US: {
    label: "United States",
    subs: "AskAnAmerican+povertyfinance+mildlyinfuriating+Anxiety+dating",
    region: "US",
    lang: "en",
    tiktok: "US",
    queries: [
      "jaw clenching OR grinding teeth",
      "dentist cost OR no insurance",
      "veneers OR turkey teeth",
      "bad breath ick",
      "zyn OR nicotine pouches gums",
    ],
  },
  DE: {
    label: "Germany",
    subs: "de+germany+FragReddit+Finanzen",
    region: "DE",
    lang: "de",
    tiktok: "DE",
    queries: [
      "Zähne knirschen OR Kieferschmerzen",
      "Zahnarzt Kosten OR Termin",
      "Veneers Türkei",
      "Mundgeruch",
      "Snus OR Vape Zähne",
    ],
  },
  FR: {
    label: "France",
    subs: "france+AskFrance+vosfinances",
    region: "FR",
    lang: "fr",
    tiktok: "FR",
    queries: [
      "grincer des dents OR machoire",
      "dentiste prix OR rendez-vous",
      "facettes dentaires Turquie",
      "mauvaise haleine",
      "puff OR vape dents",
    ],
  },
  ES: {
    label: "Spain",
    subs: "es+spain+askspain",
    region: "ES",
    lang: "es",
    tiktok: "ES",
    queries: [
      "bruxismo OR apretar dientes",
      "dentista precio OR cita",
      "carillas Turquia",
      "mal aliento",
      "vaper dientes",
    ],
  },
  IT: {
    label: "Italy",
    subs: "italy+Italia+ItaliaPersonalFinance",
    region: "IT",
    lang: "it",
    tiktok: "IT",
    queries: [
      "bruxismo OR digrignare denti",
      "dentista costo",
      "faccette dentali Turchia",
      "alito cattivo",
      "svapo denti",
    ],
  },
};

export function trim(s, n) {
  if (!s) return "";
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
}
