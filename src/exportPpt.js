import pptxgen from "pptxgenjs";

/*
  Client-side PPTX export. Takes scanned market entries and writes one deck:
  a cover, culture pulse, vocabulary, tension map, expression tracker and
  receipts per market. Colours mirror the app's system. Fonts fall back to
  Georgia (display) and Arial (body) since the app's web fonts are not
  guaranteed in PowerPoint.
*/

const BG = "070B14";
const CARD = "0E1626";
const LIGHT = "E8ECF6";
const BODY = "C3CCE0";
const MUTE = "93A0BC";
const FAINT = "6B7A99";
const RULE = "1E2A44";
const STRUCT = "6EA8FF";

const CUR = {
  AES: { c: "6EA8FF", l: "Aesthetic" },
  DAT: { c: "3DDC97", l: "Data" },
  EMO: { c: "C792EA", l: "Emotional" },
  ECO: { c: "FFB020", l: "Economic" },
};
const STATUS = { CERTIFIED: "3DDC97", PROBE: "FFB020", KILLED: "FF6B6B" };

function statusOf(e) {
  if (e.currencyGate && e.sensorGate) return "CERTIFIED";
  if (e.currencyGate || e.sensorGate) return "PROBE";
  return "KILLED";
}

function line(text, opts) {
  return { text: text || "", options: { breakLine: true, fontFace: "Arial", ...opts } };
}

function head(pptx, title, cadence) {
  const s = pptx.addSlide();
  s.background = { color: BG };
  s.addText(title, { x: 0.5, y: 0.32, w: 9.5, h: 0.5, fontFace: "Arial", fontSize: 18, bold: true, color: LIGHT, charSpacing: 3 });
  if (cadence) s.addText(cadence, { x: 10, y: 0.4, w: 2.8, h: 0.35, fontFace: "Arial", fontSize: 10, color: FAINT, align: "right", charSpacing: 2 });
  s.addShape(pptx.ShapeType.line, { x: 0.5, y: 0.95, w: 12.3, h: 0, line: { color: RULE, width: 1 } });
  return s;
}

function coverSlide(pptx, entry) {
  const m = entry.market;
  const certified = m.expressions.filter((e) => statusOf(e) === "CERTIFIED").length;
  const killed = m.expressions.filter((e) => statusOf(e) === "KILLED").length;
  const killRate = m.expressions.length ? Math.round((killed / m.expressions.length) * 100) : 0;
  const s = pptx.addSlide();
  s.background = { color: BG };
  s.addText("ORAL-B iO · CULTURAL SENSING ENGINE · v4", { x: 0.6, y: 1.3, w: 12, h: 0.4, fontFace: "Arial", fontSize: 12, color: STRUCT, charSpacing: 3 });
  s.addText("LOUDMOUTH", { x: 0.55, y: 1.7, w: 12, h: 1.6, fontFace: "Georgia", fontSize: 66, bold: true, color: LIGHT });
  s.addText(entry.label, { x: 0.6, y: 3.4, w: 12, h: 0.6, fontFace: "Georgia", fontSize: 30, color: BODY });
  s.addText(m.scannedAt || "", { x: 0.6, y: 4.1, w: 12, h: 0.4, fontFace: "Arial", fontSize: 12, color: MUTE });
  s.addText(
    [
      { text: `${certified}`, options: { fontSize: 30, bold: true, color: "3DDC97", breakLine: false } },
      { text: "  CERTIFIED       ", options: { fontSize: 12, color: FAINT, breakLine: false } },
      { text: `${killRate}%`, options: { fontSize: 30, bold: true, color: "FF6B6B", breakLine: false } },
      { text: "  KILL RATE       ", options: { fontSize: 12, color: FAINT, breakLine: false } },
      { text: `${m.tensions.length}`, options: { fontSize: 30, bold: true, color: "6EA8FF", breakLine: false } },
      { text: "  TENSIONS", options: { fontSize: 12, color: FAINT, breakLine: false } },
    ],
    { x: 0.6, y: 5.2, w: 12, h: 0.8, fontFace: "Arial" }
  );
}

function pulseSlide(pptx, entry) {
  const p = entry.market.pulse;
  if (!p || (!p.tracks?.length && !p.memes?.length)) return;
  const s = head(pptx, `${entry.label} · CULTURE PULSE`);
  const tracks = (p.tracks || []).slice(0, 5).flatMap((t) => [
    line(`${t.title} — ${t.artist}`, { fontSize: 13, color: LIGHT, bold: true }),
    line(`${t.source || ""}${t.date ? ` · ${t.date}` : ""}${t.confidence === "low" ? " · LOW CONFIDENCE" : ""}`, { fontSize: 10, color: MUTE }),
  ]);
  const memes = (p.memes || []).slice(0, 3).flatMap((mm) => [
    line(mm.name, { fontSize: 13, color: "F0E6FA", bold: true }),
    line(mm.description || "", { fontSize: 11, color: BODY }),
    line(`${mm.platform || ""}${mm.source ? ` · ${mm.source}` : ""}${mm.date ? ` · ${mm.date}` : ""}${mm.confidence === "low" ? " · LOW CONFIDENCE" : ""}`, { fontSize: 10, color: MUTE }),
  ]);
  s.addText("CHARTING NOW", { x: 0.5, y: 1.15, w: 6, h: 0.3, fontFace: "Arial", fontSize: 10, color: FAINT, charSpacing: 2 });
  s.addText(tracks.length ? tracks : [line("No tracks", { fontSize: 12, color: MUTE })], { x: 0.5, y: 1.5, w: 6.2, h: 5.4, valign: "top", lineSpacingMultiple: 1.1 });
  s.addText("LIVE MEMES", { x: 6.9, y: 1.15, w: 6, h: 0.3, fontFace: "Arial", fontSize: 10, color: FAINT, charSpacing: 2 });
  s.addText(memes.length ? memes : [line("No memes", { fontSize: 12, color: MUTE })], { x: 6.9, y: 1.5, w: 5.9, h: 5.4, valign: "top", lineSpacingMultiple: 1.1 });
}

function vocabSlide(pptx, entry) {
  const v = entry.market.vocabulary;
  if (!v) return;
  const total = Object.values(v).reduce((n, arr) => n + (arr?.length || 0), 0);
  if (!total) return;
  const s = head(pptx, `${entry.label} · VOCABULARY, SELF-TAUGHT`);
  const cols = ["AES", "DAT", "EMO", "ECO"];
  cols.forEach((c, i) => {
    const terms = v[c] || [];
    const x = 0.5 + i * 3.15;
    s.addText(CUR[c].l.toUpperCase(), { x, y: 1.15, w: 3, h: 0.3, fontFace: "Arial", fontSize: 11, bold: true, color: CUR[c].c, charSpacing: 1 });
    const body = terms.slice(0, 8).flatMap((t) => [
      line(t.term, { fontSize: 12, color: LIGHT }),
      line(t.note || "", { fontSize: 9, color: MUTE }),
    ]);
    s.addText(body.length ? body : [line("—", { fontSize: 11, color: FAINT })], { x, y: 1.55, w: 3, h: 5.3, valign: "top", lineSpacingMultiple: 1.05 });
  });
}

function tensionSlide(pptx, entry) {
  const s = head(pptx, `${entry.label} · CULTURAL TENSIONS`, "SLOW · HOLDS FOR YEARS");
  const body = entry.market.tensions.flatMap((t) => [
    line(`${t.id}   ${t.name}`, { fontSize: 16, bold: true, color: LIGHT }),
    line(t.collision || "", { fontSize: 11, color: STRUCT }),
    line(t.note || "", { fontSize: 12, color: BODY }),
    line((t.currencies || []).map((c) => CUR[c]?.l).filter(Boolean).join("   ·   "), { fontSize: 10, color: MUTE }),
    line("", { fontSize: 6 }),
  ]);
  s.addText(body, { x: 0.5, y: 1.2, w: 12.3, h: 5.8, valign: "top", lineSpacingMultiple: 1.05 });
}

function expressionSlide(pptx, entry) {
  const s = head(pptx, `${entry.label} · LIVE EXPRESSIONS`, "FAST · CHANGES WEEKLY");
  const body = entry.market.expressions.flatMap((e) => {
    const st = statusOf(e);
    return [
      {
        text: `${e.title}   `,
        options: { fontFace: "Arial", fontSize: 14, bold: true, color: LIGHT, breakLine: false },
      },
      { text: `[${st}]`, options: { fontFace: "Arial", fontSize: 11, bold: true, color: STATUS[st], breakLine: true } },
      line(`${CUR[e.currency]?.l || e.currency || ""}  ·  velocity ${e.velocity || 0}/5  ·  links ${e.tensionId}  ·  expires ${e.expiry}`, { fontSize: 10, color: MUTE }),
      line(e.summary || "", { fontSize: 12, color: BODY }),
      line(`Sensor angle: ${e.sensorAngle || ""}`, { fontSize: 10, color: "8FA3C8", italic: true }),
      line("", { fontSize: 6 }),
    ];
  });
  s.addText(body, { x: 0.5, y: 1.2, w: 12.3, h: 5.9, valign: "top", lineSpacingMultiple: 1.0 });
}

function receiptsSlide(pptx, entry) {
  const m = entry.market;
  const seen = new Set();
  const rows = [];
  for (const e of m.expressions) {
    for (const id of e.evidenceIds || []) {
      const r = m.evidence[id];
      if (!r || seen.has(id)) continue;
      seen.add(id);
      rows.push(r);
      if (rows.length >= 12) break;
    }
    if (rows.length >= 12) break;
  }
  if (!rows.length) return;
  const s = head(pptx, `${entry.label} · RECEIPTS, DATED CITATIONS`);
  const body = rows.flatMap((r) => [
    line(`"${r.text}"`, { fontSize: 12, color: LIGHT, italic: true }),
    line(`${r.source || ""}${r.date && r.date !== "undated" ? ` · ${r.date}` : ""}${r.url ? ` · ${r.url}` : ""}${r.confidence === "low" ? " · LOW CONFIDENCE" : ""}`, { fontSize: 9, color: MUTE }),
    line("", { fontSize: 6 }),
  ]);
  s.addText(body, { x: 0.5, y: 1.2, w: 12.3, h: 5.9, valign: "top", lineSpacingMultiple: 1.0 });
}

export function exportDeck(entries) {
  if (!entries || !entries.length) return;
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "LM", width: 13.33, height: 7.5 });
  pptx.layout = "LM";
  pptx.author = "LOUDMOUTH";
  pptx.title = "LOUDMOUTH scan";

  entries.forEach((entry) => {
    coverSlide(pptx, entry);
    pulseSlide(pptx, entry);
    vocabSlide(pptx, entry);
    tensionSlide(pptx, entry);
    expressionSlide(pptx, entry);
    receiptsSlide(pptx, entry);
  });

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = entries.length === 1 ? `loudmouth-${entries[0].id}-${stamp}.pptx` : `loudmouth-all-markets-${stamp}.pptx`;
  return pptx.writeFile({ fileName });
}
