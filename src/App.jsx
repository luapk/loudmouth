import React, { useState, useEffect, useCallback } from "react";
import { DEMO } from "./demoData";

/*
  LOUDMOUTH v3
  Cultural sensing engine for Oral-B's Gen Z health positioning.
  Harvests real Reddit posts and comments server-side via the keyless
  public API, clusters them with Claude into stable tensions and live
  expressions, gates every expression against the product truths, and
  attaches the receipts: actual quotes linked to their threads.
  YouTube and TikTok layers are off for now.
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
  "Reaching Reddit's public API",
  "Searching market subreddits per query",
  "Pulling top comments from the loudest threads",
  "Clustering evidence into tensions",
  "Testing bridge gates against sensor truths",
  "Attaching receipts",
];

function statusOf(exp) {
  if (exp.currencyGate && exp.sensorGate) return "CERTIFIED";
  if (exp.currencyGate || exp.sensorGate) return "PROBE";
  return "KILLED";
}

const emptyMarket = () => ({ scannedAt: null, tensions: [], expressions: [], evidence: {}, demo: false });

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
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 34, fontWeight: 560, color: "#E8ECF6", marginBottom: 20 }}>LOUDMOUTH</div>
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
  const [data, setData] = useState(() => {
    const init = {};
    MARKETS.forEach((m) => (init[m.id] = emptyMarket()));
    return init;
  });
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState(null);
  const [brief, setBrief] = useState(null);
  const [briefLoading, setBriefLoading] = useState(null);
  const [culture, setCulture] = useState(null);
  const [cultureLoading, setCultureLoading] = useState(null);
  const [cultureTab, setCultureTab] = useState(null);
  const [openEvidence, setOpenEvidence] = useState(null);
  const [sourceNotes, setSourceNotes] = useState([]);

  useEffect(() => {
    if (!scanning) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, SCAN_STAGES.length - 1)), 4000);
    return () => clearInterval(t);
  }, [scanning]);

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
    setSourceNotes([]);
  };

  const runScan = useCallback(async () => {
    setScanning(true);
    setStage(0);
    resetPanels();
    try {
      const hRes = await fetch(`/api/harvest?market=${market}`);
      const harvest = await hRes.json();
      if (!hRes.ok) throw new Error(harvest.error || "Harvest failed");
      if (!harvest.items?.length) throw new Error("Harvest returned no evidence");
      setSourceNotes(harvest.notes || []);

      setStage(3);
      const cRes = await fetch("/api/cluster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market, items: harvest.items }),
      });
      const clustered = await cRes.json();
      if (!cRes.ok) throw new Error(clustered.error || "Clustering failed");

      const evidence = {};
      harvest.items.forEach((i) => (evidence[i.id] = i));
      const c = harvest.counts || {};

      setData((d) => ({
        ...d,
        [market]: {
          scannedAt: `Live scan · ${c.reddit || 0} Reddit posts and comments · ${new Date().toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`,
          tensions: clustered.tensions,
          expressions: clustered.expressions,
          evidence,
          demo: false,
        },
      }));
    } catch (e) {
      setError(e.message);
    } finally {
      setScanning(false);
    }
  }, [market]);

  const loadDemo = useCallback(() => {
    resetPanels();
    const d = DEMO[market];
    setData((prev) => ({
      ...prev,
      [market]: {
        scannedAt: `Demo data · illustrative sample for ${marketLabel}, not live evidence`,
        tensions: d.tensions,
        expressions: d.expressions,
        evidence: d.evidence,
        demo: true,
      },
    }));
  }, [market, marketLabel]);

  const mapCulture = useCallback(
    async (exp) => {
      if (data[market].demo) {
        const c = DEMO[market].culture;
        setBrief(null);
        setCulture({ forTitle: exp.title, categories: c.categories });
        setCultureTab(c.categories[0].cat);
        return;
      }
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
    [market, data]
  );

  const generateBrief = useCallback(
    async (exp) => {
      if (data[market].demo) {
        setBrief({ forTitle: exp.title, ...DEMO[market].brief });
        return;
      }
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
    [market, data]
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
              ORAL-B iO · CULTURAL SENSING ENGINE · v3 · REDDIT PUBLIC API INGESTION
            </div>
            <h1 className="disp" style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 560, lineHeight: 0.95, margin: 0 }}>LOUDMOUTH</h1>
            <div style={{ fontSize: 14, color: "#93A0BC", marginTop: 8, maxWidth: 560 }}>
              Finds what your market is already saying out loud. Real posts and comments in, gated insight out, receipts attached.
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
            onClick={loadDemo}
            disabled={scanning}
            className="mono"
            title="Load a canned sample dataset. No keys, no network."
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              border: "1px solid rgba(255,176,32,0.5)",
              background: "rgba(255,176,32,0.1)",
              color: "#FFCB70",
            }}
          >
            DEMO DATA
          </button>
          <div className="mono" style={{ fontSize: 12, color: "#93A0BC", flex: 1, minWidth: 220 }}>
            {scanning ? (
              <span style={{ animation: "pulse 1.6s infinite" }}>▸ {SCAN_STAGES[stage]}</span>
            ) : current.scannedAt ? (
              <span>◆ {current.scannedAt}</span>
            ) : (
              <span>No signal yet for {marketLabel}. Run a live scan against Reddit.</span>
            )}
          </div>
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

        {sourceNotes.length > 0 && (
          <div className="mono" style={{ ...glass, borderColor: "rgba(255,176,32,0.3)", padding: "10px 16px", fontSize: 11, color: "#FFCB70", marginBottom: 18 }}>
            {sourceNotes.join(" · ")} · scan continued with remaining sources
          </div>
        )}

        {current.demo && (
          <div className="mono" style={{ ...glass, borderColor: "rgba(255,176,32,0.45)", background: "rgba(255,176,32,0.08)", padding: "10px 16px", fontSize: 11, color: "#FFCB70", marginBottom: 18, letterSpacing: "0.04em" }}>
            DEMO DATA · illustrative sample, not live evidence · every receipt is a placeholder, not a real post · load a live scan to replace it
          </div>
        )}

        <div className="twocol" style={{ display: "grid", gridTemplateColumns: "minmax(280px, 4fr) minmax(320px, 8fr)", gap: 20, alignItems: "start" }}>
          <div>
            <PanelHead title="TENSION MAP" cadence="SLOW · QUARTERLY" />
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
            <PanelHead title="EXPRESSION TRACKER" cadence="FAST · WEEKLY" />
            {current.expressions.length === 0 && <Empty text="Live expressions land here with velocity, expiry, bridge gates and receipts from Reddit. Run the scan." />}
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
                  <div className="mono" style={{ fontSize: 11, color: "#93A0BC", margin: "6px 0 8px", display: "flex", gap: 14, flexWrap: "wrap" }}>
                    <span>{exp.platform}</span>
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
                        {current.demo ? "RECEIPTS · DEMO SAMPLE · NOT REAL POSTS" : "RECEIPTS · REAL POSTS AND COMMENTS · UNEDITED"}
                      </div>
                      {receipts.map((r) => (
                        <div key={r.id} style={{ padding: "10px 0", borderTop: "1px solid rgba(110,168,255,0.12)" }}>
                          <div style={{ fontSize: 13, lineHeight: 1.55, color: "#DDE5F4", fontStyle: "italic" }}>"{r.text}"</div>
                          <div className="mono" style={{ fontSize: 10, color: "#8FA3C8", marginTop: 5 }}>
                            {r.source} · {r.ctx} · score {r.score}
                            {r.permalink && (
                              <>
                                {" · "}
                                <a href={r.permalink} target="_blank" rel="noreferrer">view source ↗</a>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {culture && culture.forTitle === exp.title && (
                    <div style={{ marginTop: 12, padding: 14, borderRadius: 10, background: "rgba(199,146,234,0.05)", border: "1px solid rgba(199,146,234,0.25)" }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#C792EA", marginBottom: 10 }}>
                        {current.demo ? "CULTURE MAP · DEMO SAMPLE · VERIFY NAMES BEFORE DECK" : "CULTURE MAP · LIVE SPECIMENS · VERIFY NAMES BEFORE DECK"}
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
          LOUDMOUTH v3 · EVIDENCE HARVESTED LIVE FROM REDDIT'S KEYLESS PUBLIC API · REAL POSTS AND COMMENTS, LINKED TO SOURCE · YOUTUBE AND TIKTOK LAYERS OFF FOR NOW · CULTURE SPECIMENS FROM LIVE WEB SEARCH, VERIFY BEFORE ANY DECK · INSIGHTS SHIP WITH EXPIRY DATES BY DESIGN
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

function PanelHead({ title, cadence }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(110,168,255,0.15)" }}>
      <span className="mono" style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.2em", color: "#CFE0FF" }}>{title}</span>
      <span className="mono" style={{ fontSize: 10, letterSpacing: "0.16em", color: "#5A6885" }}>{cadence}</span>
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
