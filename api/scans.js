import { kvConfigured, kvCommand, MARKET_CONFIG } from "./_lib.js";

/*
  GET  /api/scans            -> { configured, scans: { UK: {...}|null, ... } }
  POST /api/scans { market, scan } -> stores that market's latest scan

  Shared, server-side scan storage so the latest scan is visible to anyone
  who opens the tool, not just the browser that ran it. Backed by the KV /
  Upstash store when connected; returns configured:false otherwise, and the
  client falls back to its own localStorage copy.
*/

const key = (m) => `loudmouth:v4:scan:${m}`;

export default async function handler(req, res) {
  try {
    if (!kvConfigured()) return res.status(200).json({ configured: false, scans: {} });
    const markets = Object.keys(MARKET_CONFIG);

    if (req.method === "GET") {
      const vals = await kvCommand(["MGET", ...markets.map(key)]);
      const scans = {};
      markets.forEach((m, i) => {
        const v = vals?.[i];
        try {
          scans[m] = v ? (typeof v === "string" ? JSON.parse(v) : v) : null;
        } catch {
          scans[m] = null;
        }
      });
      return res.status(200).json({ configured: true, scans });
    }

    if (req.method === "POST") {
      const { market, scan } = req.body || {};
      const m = (market || "").toUpperCase();
      if (!MARKET_CONFIG[m]) return res.status(400).json({ error: "Unknown market" });
      if (!scan) return res.status(400).json({ error: "No scan supplied" });
      await kvCommand(["SET", key(m), JSON.stringify(scan)]);
      return res.status(200).json({ configured: true, ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
