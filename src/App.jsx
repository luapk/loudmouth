import React, { useState, useEffect, useCallback } from "react";

/*
  LOUDMOUTH v4
  Cultural sensing engine for Oral-B's Gen Z health positioning.
  A scan runs client-side in stages: discover this month's live vocabulary
  per currency, read the culture pulse (charting tracks and live memes),
  sweep the four currencies by web search, then cluster into stable tensions
  and live expressions gated against the product truths. The only required
  key is ANTHROPIC_API_KEY. Reddit and YouTube collectors are optional
  enrichment. The latest scan per market is persisted to localStorage so it
  survives a refresh, and any scanned market can be exported to PPTX.
*/

const PASSWORD = "mouth2026";

const MARKETS = [
  { id: "UK", label: "United Kingdom" },
  { id: "US", label: "United States" },
  { id: "DE", label: "Germany" },
  { id: "FR", label: "France" },
  { id: "ES", label: "Spain" },
  { id: "IT", label: "Italy" },
];

const CURRENCIES = {
  AES: { label: "Aesthetic", color: "#6EA8FF" },
  DAT: { label: "Data", color: "#3DDC97" },
  EMO: { label: "Emotional", color: "#C792EA" },
  ECO: { label: "Economic", color: "#FFB020" },
};

const STATUS_STYLE = {
  CERTIFIED: { color: "#3DDC97", bg: "rgba(61,220,151,0.12)" },
  PROBE: { color: "#FFB020", bg: "rgba(255,176,32,0.12)" },
  KILLED: { color: "#FF6B6B", bg: "rgba(255,107,107,0.10)" },
};

const SCAN_STAGES = [
  "Discovering vocabulary",
  "Reading the charts",
  "Sweeping four currencies",
  "Clustering evidence",
  "Gating against sensor truths",
];

function statusOf(exp) {
  if (exp.currencyGate && exp.sensorGate) return "CERTIFIED";
  if (exp.currencyGate || exp.sensorGate) return "PROBE";
  return "KILLED";
}

const emptyMarket = () => ({ scannedAt: null, tensions: [], expressions: [], evidence: {}, vocabulary: null, pulse: null, collectors: null });

const STORAGE_KEY = "loudmouth_scans_v4";

function loadStored() {
  const init = {};
  MARKETS.forEach((m) => (init[m.id] = emptyMarket()));
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    Object.keys(saved).forEach((k) => {
      if (init[k]) init[k] = { ...init[k], ...saved[k] };
    });
  } catch {
    // corrupt or unavailable storage, start clean
  }
  return init;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  // Read as text first: a timed-out or crashed function returns a plain-text
  // platform page, not JSON, and we want a readable error, not "Unexpected token".
  const raw = await res.text();
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    const snippet = raw.slice(0, 90).replace(/\s+/g, " ").trim();
    const stage = url.replace("/api/", "");
    throw new Error(`${stage} did not return JSON (HTTP ${res.status}): ${snippet}. This usually means the function timed out or crashed.`);
  }
  if (!res.ok) throw new Error(json.error || `${url} failed`);
  return json;
}

const glass = {
  background: "rgba(255,255,255,0.028)",
  border: "1px solid rgba(110,168,255,0.13)",
  backdropFilter: "blur(14px)",
  borderRadius: 14,
};

export default function App() {
  const [unlocked, setUnlocked] = useState(false);
  return unlocked ? <Loudmouth /> : <Gatekeeper onUnlock={() => setUnlocked(true)} />;
}

function Gatekeeper({ onUnlock }) {
  const [value, setValue] = useState("");
  const [shake, setShake] = useState(false);
  const submit = () => {
    if (value === PASSWORD) onUnlock();
    else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        backgroundColor: "#070B14",
        backgroundImage:
          "linear-gradient(180deg, rgba(7,11,20,0.62), rgba(7,11,20,0.86)), url('/gate-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div style={{ ...glass, padding: 36, width: 320, textAlign: "center", transform: shake ? "translateX(6px)" : "none", transition: "transform 0.1s" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.28em", color: "#6EA8FF", marginBottom: 10 }}>
          RESTRICTED · ADAM&EVETBWA
        </div>
        <div style={{ fontFamily: "'Syne', 'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 800, letterSpacing: "-0.02em", color: "#E8ECF6", marginBottom: 20 }}>LOUDMOUTH</div>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(110,168,255,0.3)", background: "rgba(255,255,255,0.04)", color: "#E8ECF6", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, outline: "none", marginBottom: 12 }}
        />
        <button
          onClick={submit}
          style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #2E6BFF, #6EA8FF)", color: "#06101F", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em" }}
        >
          ENTER
        </button>
      </div>
    </div>
  );
}

function Loudmouth() {
  const [market, setMarket] = useState("UK");
  const [data, setData] = useState(loadStored);

  // Persist scans so the latest is available after a refresh.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // storage full or unavailable, non-fatal
    }
  }, [data]);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(null);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(null);
  const [culture, setCulture] = useState(null);
  const [cultureLoading, setCultureLoading] = useState(null);
  const [cultureTab, setCultureTab] = useState(null);
  const [openEvidence, setOpenEvidence] = useState(null);
  const [shareStatus, setShareStatus] = useState(null);

  // Pull any shared scans from the server store on load, so a scan run
  // elsewhere is visible here. Falls back to local-only when no store.
  useEffect(() => {
    let alive = true;
    fetch("/api/scans")
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        setShareStatus(j.configured ? "shared" : "local");
        if (j.configured && j.scans) {
          setData((d) => {
            const next = { ...d };
            Object.keys(j.scans).forEach((k) => {
              if (j.scans[k] && next[k]) next[k] = { ...next[k], ...j.scans[k] };
            });
            return next;
          });
        }
      })
      .catch(() => alive && setShareStatus("local"));
    return () => {
      alive = false;
    };
  }, []);

  const current = data[market];
  const marketLabel = MARKETS.find((m) => m.id === market).label;

  const certified = current.expressions.filter((e) => statusOf(e) === "CERTIFIED").length;
  const killed = current.expressions.filter((e) => statusOf(e) === "KILLED").length;
  const killRate = current.expressions.length ? Math.round((killed / current.expressions.length) * 100) : 0;

  const resetPanels = () => {
    setBrief(null);
    setCulture(null);
    setOpenEvidence(null);
    setError(null);
  };

  const runScan = useCallback(async () => {
    setScanning(true);
    setStage(0);
    resetPanels();
    const currencies = Object.keys(CURRENCIES);
    try {
      // Stage 0: discover this month's vocabulary, one call per currency in
      // parallel so each function runs a single search and stays under 60s.
      const discParts = await Promise.all(
        currencies.map((c) =>
          postJSON("/api/discover", { market, currency: c })
            .then((r) => r.vocabulary?.[c] || [])
            .catch(() => [])
        )
      );
      const vocabulary = {};
      currencies.forEach((c, i) => (vocabulary[c] = discParts[i]));

      // Stage 1: culture pulse, tracks and memes as separate parallel calls.
      setStage(1);
      const [trk, mem] = await Promise.all([
        postJSON("/api/pulse", { market, job: "tracks" }).catch(() => ({ tracks: [] })),
        postJSON("/api/pulse", { market, job: "memes" }).catch(() => ({ memes: [] })),
      ]);
      const pulse = { tracks: trk.tracks || [], memes: mem.memes || [] };

      // Stage 2: sweep the four currencies in parallel, each seeded by its
      // discovered vocabulary. A failed currency degrades to empty, never fatal.
      setStage(2);
      const sweeps = await Promise.all(
        currencies.map((c) =>
          postJSON("/api/sweep", { market, currency: c, vocabulary: vocabulary[c].map((v) => v.term) })
            .then((r) => r.items || [])
            .catch(() => [])
        )
      );
      let evidence = sweeps.flat();

      // Optional collector enrichment. Best-effort, never blocks the scan.
      let collectors = "Search-driven scan, collectors offline";
      try {
        const h = await fetch(`/api/harvest?market=${market}`).then((r) => r.json());
        if (h.ran && h.items?.length) {
          evidence = evidence.concat(h.items);
          collectors = `Collectors online, ${h.count} extra receipts merged`;
        } else if (h.notes?.length) {
          collectors = `Search-driven scan, collectors offline (${h.notes.join(" · ")})`;
        }
      } catch {
        // enrichment is optional, ignore
      }

      if (!evidence.length) throw new Error("The sweep gathered no evidence this scan. Try again or check ANTHROPIC_API_KEY.");

      let n = 0;
      const withIds = evidence.map((i) => ({ id: `E${++n}`, ...i }));
      const evidenceMap = {};
      withIds.forEach((i) => (evidenceMap[i.id] = i));

      // Stage 3: cluster into the two-speed structure.
      setStage(3);
      const clustered = await postJSON("/api/cluster", { market, items: withIds, pulse });
      setStage(4);

      const now = new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      const scanObj = {
        scannedAt: `Live scan · ${withIds.length} evidence · ${pulse.tracks?.length || 0} tracks · ${pulse.memes?.length || 0} memes · ${now}`,
        tensions: clustered.tensions,
        expressions: clustered.expressions,
        evidence: evidenceMap,
        vocabulary,
        pulse,
        collectors,
      };
      setData((d) => ({ ...d, [market]: scanObj }));

      // Share to the server store when one is connected.
      fetch("/api/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market, scan: scanObj }),
      })
        .then((r) => r.json())
        .then((j) => j.configured && setShareStatus("shared"))
        .catch(() => {});
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  }, [market]);

  const scannedEntries = MARKETS.map((m) => ({ id: m.id, label: m.label, market: data[m.id] })).filter(
    (e) => e.market.scannedAt && e.market.expressions.length
  );

  const downloadPpt = useCallback(
    (scope) => {
      const entries = scope === "all" ? scannedEntries : scannedEntries.filter((e) => e.id === market);
      if (!entries.length) return;
      // Lazy-load the exporter so pptxgenjs stays out of the initial bundle.
      import("./exportPpt")
        .then((m) => m.exportDeck(entries))
        .catch((e) => setError(`Export failed: ${e.message}`));
    },
    [scannedEntries, market]
  );

  const mapCulture = useCallback(
    async (exp) => {
      setCultureLoading(exp.title);
      setCulture(null);
      setError(null);
      try {
        const res = await fetch("/api/culture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ market, expression: exp }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Culture map failed");
        setCulture({ forTitle: exp.title, categories: json.categories });
        setCultureTab(json.categories[0].cat);
      } catch (e) {
        setError(e.message);
      } finally {
        setCultureLoading(null);
      }
    },
    [market]
  );

  const generateBrief = useCallback(
    async (exp) => {
      setBriefLoading(exp.title);
      setBrief(null);
      setError(null);
      try {
        const res = await fetch("/api/probe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ market, expression: exp }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Brief failed");
        setBrief({ forTitle: exp.title, ...json });
      } catch (e) {
        setError(e.message);
      } finally {
        setBriefLoading(null);
      }
    },
    [market]
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(1100px 500px at 75% -10%, rgba(30,80,200,0.22), transparent 60%), radial-gradient(700px 400px at 0% 110%, rgba(90,40,180,0.14), transparent 60%), #070B14",
        color: "#E8ECF6",
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        padding: "28px 20px 60px",
      }}
    >
      <style>{`
        .mono { font-family: 'JetBrains Mono', monospace; }
        .disp { font-family: 'Fraunces', serif; }
        button { cursor: pointer; }
        button:focus-visible { outline: 2px solid #6EA8FF; outline-offset: 2px; }
        a { color: #6EA8FF; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.35 } }
        @media (max-width: 900px) { .twocol { grid-template-columns: 1fr !important; } }
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 18, marginBottom: 26 }}>
          <div>
            <div className="mono" style={{ fontSize: 10, letterSpacing: "0.28em", color: "#6EA8FF", marginBottom: 8 }}>
              ORAL-B iO · CULTURAL SENSING ENGINE · v4 · WEB SEARCH HARVEST · SELF-TAUGHT VOCABULARY
            </div>
            <h1 style={{ fontFamily: "'Syne', 'Space Grotesk', sans-serif", fontSize: "clamp(44px, 6.5vw, 72px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.92, margin: 0 }}>LOUDMOUTH</h1>
            <div style={{ fontSize: 14, color: "#93A0BC", marginTop: 8, maxWidth: 560 }}>
              Teaches itself this month's language of the mouth in culture, reads the market's pulse, gates the insight, cites the source and date.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MARKETS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMarket(m.id);
                  resetPanels();
                }}
                className="mono"
                style={{
                  padding: "8px 14px",
                  borderRadius: 999,
                  fontSize: 12,
                  letterSpacing: "0.08em",
                  border: market === m.id ? "1px solid #6EA8FF" : "1px solid rgba(255,255,255,0.12)",
                  background: market === m.id ? "rgba(110,168,255,0.16)" : "transparent",
                  color: market === m.id ? "#CFE0FF" : "#93A0BC",
                }}
              >
                {m.id}
              </button>
            ))}
          </div>
        </div>

        <div style={{ ...glass, padding: "14px 18px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, marginBottom: 22 }}>
          <button
            onClick={runScan}
            disabled={scanning}
            className="mono"
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.06em",
              background: scanning ? "rgba(110,168,255,0.25)" : "linear-gradient(135deg, #2E6BFF, #6EA8FF)",
              color: scanning ? "#93A0BC" : "#06101F",
            }}
          >
            {scanning ? "SCANNING…" : `RUN LIVE SCAN · ${market}`}
          </button>
          <button
            onClick={() => downloadPpt("market")}
            disabled={scanning || !current.scannedAt || !current.expressions.length}
            className="mono"
            title="Download this market's latest scan as a PPTX deck."
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              border: "1px solid rgba(61,220,151,0.4)",
              background: "rgba(61,220,151,0.1)",
              color: current.scannedAt && current.expressions.length ? "#8DEFC2" : "#4A6455",
              opacity: current.scannedAt && current.expressions.length ? 1 : 0.5,
            }}
          >
            PPT · {market}
          </button>
          <button
            onClick={() => downloadPpt("all")}
            disabled={scanning || scannedEntries.length === 0}
            className="mono"
            title="Download every scanned market as one PPTX deck."
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              border: "1px solid rgba(110,168,255,0.4)",
              background: "rgba(110,168,255,0.1)",
              color: scannedEntries.length ? "#CFE0FF" : "#3A4A66",
              opacity: scannedEntries.length ? 1 : 0.5,
            }}
          >
            PPT · ALL ({scannedEntries.length})
          </button>
          <div className="mono" style={{ fontSize: 12, color: "#93A0BC", flex: 1, minWidth: 220 }}>
            {scanning ? (
              <span style={{ animation: "pulse 1.6s infinite" }}>▸ {stage + 1}/{SCAN_STAGES.length} · {SCAN_STAGES[stage]}</span>
            ) : current.scannedAt ? (
              <span>◆ {current.scannedAt}</span>
            ) : (
              <span>No signal yet for {marketLabel}. Run a live scan, only ANTHROPIC_API_KEY needed.</span>
            )}
          </div>
          {shareStatus && (
            <span
              className="mono"
              title={shareStatus === "shared" ? "Scans save to the shared store and are visible to everyone who opens the tool." : "Scans save in this browser only. Connect a store to share them."}
              style={{
                fontSize: 9,
                letterSpacing: "0.14em",
                padding: "3px 9px",
                borderRadius: 999,
                border: shareStatus === "shared" ? "1px solid rgba(61,220,151,0.4)" : "1px solid rgba(255,255,255,0.14)",
                color: shareStatus === "shared" ? "#3DDC97" : "#5A6885",
                whiteSpace: "nowrap",
              }}
            >
              {shareStatus === "shared" ? "● SHARED" : "○ LOCAL ONLY"}
            </span>
          )}
          <div style={{ display: "flex", gap: 22 }}>
            <Stat label="CERTIFIED" value={certified} color="#3DDC97" />
            <Stat label="KILL RATE" value={`${killRate}%`} color="#FF6B6B" />
            <Stat label="TENSIONS" value={current.tensions.length} color="#6EA8FF" />
          </div>
        </div>

        {error && (
          <div className="mono" style={{ ...glass, borderColor: "rgba(255,107,107,0.35)", padding: "10px 16px", fontSize: 12, color: "#FF9B9B", marginBottom: 18 }}>
            {error}
          </div>
        )}

        {current.collectors && (
          <div className="mono" style={{ fontSize: 10, color: "#5A6885", marginBottom: 16, letterSpacing: "0.06em" }}>
            {current.collectors}
          </div>
        )}

        {current.pulse && <CulturePulse pulse={current.pulse} />}

        {current.vocabulary && <Vocabulary vocabulary={current.vocabulary} />}

        <div className="twocol" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 4fr) minmax(320px, 8fr)", gap: 20, alignItems: "start" }}>
          <div>
            <PanelHead title="CULTURAL TENSIONS" cadence="SLOW · HOLDS FOR YEARS" hint="The deep currents: lasting collisions in the culture that barely move year to year." />
            {current.tensions.length === 0 && <Empty text="Tensions appear here. They hold for years; the scan finds which ones this market lives in." />}
            {current.tensions.map((t) => (
              <div key={t.id} style={{ ...glass, padding: 16, marginBottom: 12, borderLeft: "3px solid #6EA8FF" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <div className="disp" style={{ fontSize: 20, fontWeight: 560 }}>{t.name}</div>
                  <div className="mono" style={{ fontSize: 10, color: "#6EA8FF" }}>{t.id}</div>
                </div>
                <div className="mono" style={{ fontSize: 11, letterSpacing: "0.1em", color: "#93A0BC", margin: "6px 0 8px" }}>{t.collision}</div>
                <div style={{ fontSize: 13, lineHeight: 1.5, color: "#C3CCE0" }}>{t.note}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  {(t.currencies || []).map((c) =>
                    CURRENCIES[c] ? (
                      <span key={c} className="mono" style={{ fontSize: 10, padding: "3px 8px", borderRadius: 999, color: CURRENCIES[c].color, border: `1px solid ${CURRENCIES[c].color}44` }}>
                        {CURRENCIES[c].label}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>

          <div>
            <PanelHead title="LIVE EXPRESSIONS" cadence="FAST · CHANGES WEEKLY" hint="How those tensions show up right now: the current trends and behaviours they wear." />
            {current.expressions.length === 0 && <Empty text="Live expressions land here with velocity, expiry, bridge gates and receipts from Reddit and YouTube. Run the scan." />}
            {current.expressions.map((exp, i) => {
              const st = statusOf(exp);
              const ss = STATUS_STYLE[st];
              const receipts = (exp.evidenceIds || []).map((id) => current.evidence[id]).filter(Boolean);
              const evidenceOpen = openEvidence === exp.title;
              return (
                <div key={i} style={{ ...glass, padding: 18, marginBottom: 12, opacity: st === "KILLED" ? 0.55 : 1 }}>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <div className="disp" style={{ fontSize: 19, fontWeight: 560 }}>{exp.title}</div>
                    <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", padding: "4px 10px", borderRadius: 999, color: ss.color, background: ss.bg }}>{st}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "#93A0BC", margin: "6px 0 8px", display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                    {CURRENCIES[exp.currency] && (
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 999, color: CURRENCIES[exp.currency].color, border: `1px solid ${CURRENCIES[exp.currency].color}44` }}>
                        {CURRENCIES[exp.currency].label}
                      </span>
                    )}
                    <span style={{ color: "#FFB020" }}>
                      {"▮".repeat(exp.velocity || 0)}
                      {"▯".repeat(Math.max(0, 5 - (exp.velocity || 0)))} velocity
                    </span>
                    <span>links {exp.tensionId}</span>
                    <span>expires {exp.expiry}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.55, color: "#C3CCE0" }}>{exp.summary}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: 14, flexWrap: "wrap" }}>
                    <Gate label="CURRENCY" pass={exp.currencyGate} />
                    <Wire pass={exp.currencyGate} />
                    <Gate label="SENSOR" pass={exp.sensorGate} />
                    <Wire pass={exp.currencyGate && exp.sensorGate} />
                    <div className="mono" style={{ fontSize: 10, color: ss.color, letterSpacing: "0.1em" }}>{st}</div>
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: "#8FA3C8", marginTop: 8, lineHeight: 1.5 }}>↳ {exp.sensorAngle}</div>

                  <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                    {receipts.length > 0 && (
                      <ActionButton color="#6EA8FF" onClick={() => setOpenEvidence(evidenceOpen ? null : exp.title)}>
                        {evidenceOpen ? "HIDE RECEIPTS" : `RECEIPTS (${receipts.length})`}
                      </ActionButton>
                    )}
                    {st !== "KILLED" && (
                      <ActionButton color="#C792EA" onClick={() => mapCulture(exp)} disabled={cultureLoading === exp.title}>
                        {cultureLoading === exp.title ? "SCANNING CULTURE…" : "MAP TO CULTURE"}
                      </ActionButton>
                    )}
                    {st === "CERTIFIED" && (
                      <ActionButton color="#3DDC97" onClick={() => generateBrief(exp)} disabled={briefLoading === exp.title}>
                        {briefLoading === exp.title ? "WRITING…" : "GENERATE PROBE BRIEF"}
                      </ActionButton>
                    )}
                  </div>

                  {evidenceOpen && receipts.length > 0 && (
                    <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(110,168,255,0.05)", border: "1px solid rgba(110,168,255,0.25)" }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#6EA8FF", marginBottom: 10 }}>
                        RECEIPTS · DATED SOURCE CITATIONS
                      </div>
                      {receipts.map((r) => {
                        const link = r.url || r.permalink;
                        const dated = r.date && r.date !== "undated";
                        return (
                          <div key={r.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(110,168,255,0.12)" }}>
                            <div style={{ fontSize: 13, lineHeight: 1.55, color: "#DDE5F4", fontStyle: "italic" }}>"{r.text}"</div>
                            <div className="mono" style={{ fontSize: 10, color: "#8FA3C8", marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                              <span>{r.source}{r.ctx ? ` · ${r.ctx}` : ""}{dated ? ` · ${r.date}` : ""}</span>
                              {link && (
                                <a href={link} target="_blank" rel="noreferrer">view source ↗</a>
                              )}
                              {r.confidence === "low" && <Conf />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {culture && culture.forTitle === exp.title && (
                    <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(199,146,234,0.05)", border: "1px solid rgba(199,146,234,0.25)" }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#C792EA", marginBottom: 10 }}>
                        CULTURE MAP · LIVE SPECIMENS · VERIFY NAMES BEFORE DECK
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                        {culture.categories.map((cat) => (
                          <button
                            key={cat.cat}
                            onClick={() => setCultureTab(cat.cat)}
                            className="mono"
                            style={{
                              padding: "5px 12px",
                              borderRadius: 999,
                              fontSize: 10,
                              letterSpacing: "0.12em",
                              border: cultureTab === cat.cat ? "1px solid #C792EA" : "1px solid rgba(255,255,255,0.12)",
                              background: cultureTab === cat.cat ? "rgba(199,146,234,0.16)" : "transparent",
                              color: cultureTab === cat.cat ? "#E7D4F7" : "#8FA3C8",
                            }}
                          >
                            {cat.cat}
                          </button>
                        ))}
                      </div>
                      {(culture.categories.find((c) => c.cat === cultureTab) || culture.categories[0]).items.map((item, k) => (
                        <div key={k} style={{ padding: "10px 0", borderTop: k === 0 ? "none" : "1px solid rgba(199,146,234,0.15)" }}>
                          <div className="disp" style={{ fontSize: 16, fontWeight: 560, color: "#F0E6FA" }}>{item.name}</div>
                          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.06em", color: "#B79BD4", margin: "3px 0" }}>{item.detail}</div>
                          <div style={{ fontSize: 12.5, lineHeight: 1.5, color: "#C3CCE0" }}>{item.why}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {brief && brief.forTitle === exp.title && (
                    <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(61,220,151,0.06)", border: "1px solid rgba(61,220,151,0.25)" }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#3DDC97", marginBottom: 8 }}>
                        UNBRANDED PROBE · PRE-SPEND VALIDATION
                      </div>
                      <BriefRow k="Hook" v={brief.hook} />
                      <BriefRow k="Format" v={brief.format} />
                      <BriefRow k="Creator" v={brief.creator} />
                      <BriefRow k="Caption" v={brief.caption} />
                      <BriefRow k="Certifies if" v={brief.success} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mono" style={{ fontSize: 10, marginTop: 30, letterSpacing: "0.12em", color: "#5A6885", lineHeight: 1.8 }}>
          LOUDMOUTH v4 · VOCABULARY SELF-TAUGHT PER SCAN · EVIDENCE HARVESTED LIVE BY WEB SEARCH, EACH ITEM SOURCED AND DATED · MEMES ARE THIS WEEK NOT THIS MORNING, TRACKS ARE CHART DATA · CULTURE SPECIMENS AND NAMES, VERIFY BEFORE ANY DECK · INSIGHTS SHIP WITH EXPIRY DATES BY DESIGN
        </div>
      </div>
    </div>
  );
}

function ActionButton({ color, onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mono"
      style={{
        padding: "7px 14px",
        borderRadius: 8,
        fontSize: 11,
        letterSpacing: "0.08em",
        border: `1px solid ${color}66`,
        background: `${color}14`,
        color,
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div className="mono" style={{ fontSize: 18, fontWeight: 600, color }}>{value}</div>
      <div className="mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "#5A6885" }}>{label}</div>
    </div>
  );
}

function Conf() {
  return (
    <span className="mono" style={{ fontSize: 8, letterSpacing: "0.14em", color: "#FFB020", border: "1px solid rgba(255,176,32,0.4)", borderRadius: 4, padding: "1px 5px" }}>
      LOW CONFIDENCE
    </span>
  );
}

function CulturePulse({ pulse }) {
  const tracks = pulse.tracks || [];
  const memes = pulse.memes || [];
  if (!tracks.length && !memes.length) return null;
  return (
    <div style={{ ...glass, padding: "14px 16px", marginBottom: 18 }}>
      <div className="mono" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", color: "#CFE0FF", marginBottom: 12 }}>
        CULTURE PULSE · THE FEED, AUDIBLE AND VISIBLE
      </div>
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px", minWidth: 260 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "#5A6885", marginBottom: 8 }}>CHARTING NOW · {tracks.length}</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {tracks.map((t, i) => (
              <div key={i} style={{ minWidth: 150, flex: "0 0 auto", padding: "10px 12px", borderRadius: 10, background: "rgba(110,168,255,0.06)", border: "1px solid rgba(110,168,255,0.18)" }}>
                <div className="disp" style={{ fontSize: 14, fontWeight: 560, color: "#E8ECF6", lineHeight: 1.2 }}>{t.title}</div>
                <div className="mono" style={{ fontSize: 10, color: "#93A0BC", margin: "3px 0" }}>{t.artist}</div>
                {t.context && <div style={{ fontSize: 11, color: "#8FA3C8", lineHeight: 1.4 }}>{t.context}</div>}
                <div className="mono" style={{ fontSize: 9, color: "#5A6885", marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span>{t.source}{t.date ? ` · ${t.date}` : ""}</span>
                  {t.confidence === "low" && <Conf />}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ flex: "1 1 260px", minWidth: 220 }}>
          <div className="mono" style={{ fontSize: 9, letterSpacing: "0.18em", color: "#5A6885", marginBottom: 8 }}>LIVE MEMES · {memes.length}</div>
          <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4 }}>
            {memes.map((m, i) => (
              <div key={i} style={{ minWidth: 170, flex: "0 0 auto", padding: "10px 12px", borderRadius: 10, background: "rgba(199,146,234,0.06)", border: "1px solid rgba(199,146,234,0.18)" }}>
                <div className="disp" style={{ fontSize: 14, fontWeight: 560, color: "#F0E6FA", lineHeight: 1.2 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#C3CCE0", lineHeight: 1.4, margin: "3px 0" }}>{m.description}</div>
                <div className="mono" style={{ fontSize: 9, color: "#5A6885", marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span>{m.platform}{m.source ? ` · ${m.source}` : ""}{m.date ? ` · ${m.date}` : ""}</span>
                  {m.confidence === "low" && <Conf />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Vocabulary({ vocabulary }) {
  const [open, setOpen] = useState(false);
  const total = Object.values(vocabulary).reduce((n, arr) => n + (arr?.length || 0), 0);
  if (!total) return null;
  return (
    <div style={{ ...glass, padding: "12px 16px", marginBottom: 20 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mono"
        style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: "#CFE0FF", fontSize: 11, fontWeight: 600, letterSpacing: "0.2em", padding: 0 }}
      >
        <span>VOCABULARY · SELF-TAUGHT TODAY · {total} TERMS</span>
        <span style={{ color: "#5A6885" }}>{open ? "HIDE ▲" : "SHOW ▼"}</span>
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginTop: 14 }}>
          {Object.keys(CURRENCIES).map((c) => {
            const terms = vocabulary[c] || [];
            if (!terms.length) return null;
            const col = CURRENCIES[c].color;
            return (
              <div key={c}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: col, marginBottom: 8 }}>{CURRENCIES[c].label.toUpperCase()}</div>
                {terms.map((t, i) => (
                  <div key={i} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 13, color: "#E8ECF6", lineHeight: 1.3 }}>{t.term}</div>
                    {t.note && <div className="mono" style={{ fontSize: 10, color: "#8FA3C8", lineHeight: 1.4 }}>{t.note}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PanelHead({ title, cadence, hint }) {
  return (
    <div style={{ marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(110,168,255,0.15)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span className="mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", color: "#CFE0FF" }}>{title}</span>
        <span className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "#5A6885", whiteSpace: "nowrap" }}>{cadence}</span>
      </div>
      {hint && <div style={{ fontSize: 11.5, color: "#8FA3C8", marginTop: 5, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: "26px 18px", borderRadius: 14, border: "1px dashed rgba(110,168,255,0.2)", fontSize: 13, color: "#8FA3C8", lineHeight: 1.5 }}>
      {text}
    </div>
  );
}

function Gate({ label, pass }) {
  const c = pass ? "#3DDC97" : "#FF6B6B";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: "50%", background: c, boxShadow: `0 0 8px ${c}66` }} />
      <span className="mono" style={{ fontSize: 9, letterSpacing: "0.14em", color: "#8FA3C8" }}>{label}</span>
    </div>
  );
}

function Wire({ pass }) {
  return <div style={{ width: 26, height: 1, margin: "0 8px", background: pass ? "rgba(61,220,151,0.6)" : "rgba(255,255,255,0.15)" }} />;
}

function BriefRow({ k, v }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "#5A6885", minWidth: 78, paddingTop: 2 }}>{k.toUpperCase()}</span>
      <span style={{ fontSize: 13, color: "#DDE5F4", lineHeight: 1.45 }}>{v}</span>
    </div>
  );
}
