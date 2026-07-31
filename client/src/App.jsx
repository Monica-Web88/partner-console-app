import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  ChevronDown,
  Radio,
  Activity,
  Database,
  Signal,
  Upload,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { api } from "./api";

const COLORS = {
  void: "#0B0E13",
  panel: "#12161F",
  panelRaised: "#1A2029",
  line: "#242C3A",
  textPrimary: "#E9ECF2",
  textMuted: "#7C8698",
  green: "#3ED98A",
  amber: "#F5A94E",
  red: "#F2555A",
  cyan: "#4FD8E8",
};

const STAGES = [
  { key: "submitted", label: "Submitted" },
  { key: "validating", label: "Validating" },
  { key: "qa", label: "QA Review" },
  { key: "live", label: "Live" },
];

function SignalBars({ status }) {
  const heights = { pass: [6, 10, 14, 18], warn: [6, 10, 14, 6], fail: [6, 4, 4, 4] };
  const color = { pass: COLORS.green, warn: COLORS.amber, fail: COLORS.red }[status];
  const bars = heights[status] || heights.fail;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 18 }}>
      {bars.map((h, i) => (
        <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: color, opacity: status === "fail" && i > 0 ? 0.25 : 1 }} />
      ))}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "pass") return <CheckCircle2 size={15} color={COLORS.green} />;
  if (status === "warn") return <AlertTriangle size={15} color={COLORS.amber} />;
  return <XCircle size={15} color={COLORS.red} />;
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ background: COLORS.panelRaised, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 600, color: accent || COLORS.textPrimary, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );
}

const SAMPLE_VALID = `<?xml version="1.0" encoding="UTF-8"?>
<program>
  <channelId>ACME-EAST-01</channelId>
  <airDate>2026-08-04T20:00:00Z</airDate>
  <programTitle>Late Night Rundown</programTitle>
  <ratingSystem>TV-14</ratingSystem>
  <closedCaptionUrl>https://cdn.acme.tv/cc/4021.vtt</closedCaptionUrl>
  <durationSeconds>3600</durationSeconds>
  <contentAdvisory>Language, brief violence</contentAdvisory>
  <streamUri>https://cdn.acme.tv/streams/4021.m3u8</streamUri>
</program>`;

const SAMPLE_ERRORS = `<?xml version="1.0" encoding="UTF-8"?>
<program>
  <channelId>WSL-CENTRAL-02</channelId>
  <airDate>2026-08-05T18:30:00Z</airDate>
  <programTitle>Morning Digest</programTitle>
  <durationSeconds>3600.5</durationSeconds>
  <streamUri></streamUri>
</program>`;

export default function App() {
  const [partners, setPartners] = useState([]);
  const [partnerId, setPartnerId] = useState(null);
  const [feed, setFeed] = useState(null);
  const [results, setResults] = useState([]);
  const [failingFields, setFailingFields] = useState([]);
  const [events, setEvents] = useState([]);
  const [sql, setSql] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const partner = partners.find((p) => p.id === partnerId);

  const refreshFeed = useCallback(async (pid) => {
    if (!pid) return;
    const data = await api.getLatestFeed(pid);
    setFeed(data.feed);
    setResults(data.results);
  }, []);

  const refreshAll = useCallback(async () => {
    const [ff, ev] = await Promise.all([api.getFailingFields(7), api.getRecentEvents(20)]);
    setFailingFields(ff.rows);
    setSql(ff.sql);
    setEvents(ev);
  }, []);

  useEffect(() => {
    (async () => {
      const p = await api.getPartners();
      setPartners(p);
      if (p.length) setPartnerId(p[0].id);
    })();
    refreshAll();
    const t = setInterval(refreshAll, 8000);
    return () => clearInterval(t);
  }, [refreshAll]);

  useEffect(() => {
    if (partnerId) refreshFeed(partnerId);
  }, [partnerId, refreshFeed]);

  async function submitXml(xml, filename) {
    if (!partnerId) return;
    setBusy(true);
    setError(null);
    try {
      await api.validateFeed(partnerId, filename, xml);
      await refreshFeed(partnerId);
      await refreshAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function onFileChosen(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => submitXml(String(reader.result), file.name);
    reader.readAsText(file);
    e.target.value = "";
  }

  async function setStage(stage) {
    if (!partnerId) return;
    await api.setPartnerStatus(partnerId, stage);
    const p = await api.getPartners();
    setPartners(p);
    await refreshAll();
  }

  const passCount = results.filter((r) => r.status === "pass").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const failCount = results.filter((r) => r.status === "fail").length;

  return (
    <div style={{ background: COLORS.void, color: COLORS.textPrimary, fontFamily: "'IBM Plex Sans','Inter',sans-serif", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        * { box-sizing: border-box; }
        .scan-track { animation: scan 80s linear infinite; }
        @keyframes scan { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .stage-btn:hover { background: ${COLORS.panelRaised} !important; cursor: pointer; }
        .upload-btn:hover { filter: brightness(1.15); }
        ::-webkit-scrollbar { height: 6px; width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.line}; border-radius: 3px; }
      `}</style>

      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", borderBottom: `1px solid ${COLORS.line}`, background: COLORS.panel }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Radio size={20} color={COLORS.cyan} />
          <div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 16 }}>Monica's Partner Ingestion Console</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'IBM Plex Mono',monospace" }}>
              TV PARTNER ENGINEERING · ONBOARDING &amp; FEED VALIDATION
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: COLORS.panelRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "7px 10px", width: 200 }}>
            <Search size={14} color={COLORS.textMuted} />
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>Search feed ID…</span>
          </div>
          <div style={{ position: "relative" }}>
            <select
              value={partnerId || ""}
              onChange={(e) => setPartnerId(e.target.value)}
              style={{ appearance: "none", background: COLORS.panelRaised, border: `1px solid ${COLORS.line}`, color: COLORS.textPrimary, borderRadius: 8, padding: "8px 30px 8px 12px", fontSize: 13, fontFamily: "inherit" }}
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown size={14} color={COLORS.textMuted} style={{ position: "absolute", right: 10, top: 10, pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {/* Pipeline stepper */}
      <div style={{ display: "flex", gap: 8, padding: "16px 24px 0" }}>
        {STAGES.map((s, i) => (
          <button
            key={s.key}
            className="stage-btn"
            onClick={() => setStage(s.key)}
            style={{ flex: 1, textAlign: "left", background: partner?.status === s.key ? COLORS.panelRaised : "transparent", border: `1px solid ${partner?.status === s.key ? COLORS.cyan : COLORS.line}`, borderRadius: 10, padding: "10px 14px", color: COLORS.textPrimary }}
          >
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "'IBM Plex Mono',monospace" }}>STAGE {i + 1}</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 14, marginTop: 2 }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Main grid */}
      <div style={{ display: "flex", gap: 16, padding: 24, flex: 1, flexWrap: "wrap" }}>
        {/* Left: feed validator */}
        <div style={{ flex: "2 1 480px", minWidth: 320 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
            <StatCard label="Fields passing" value={passCount} accent={COLORS.green} />
            <StatCard label="Warnings" value={warnCount} accent={COLORS.amber} />
            <StatCard label="Blocking errors" value={failCount} accent={COLORS.red} />
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button className="upload-btn" onClick={() => fileInputRef.current?.click()} disabled={busy}
              style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.cyan, color: COLORS.void, border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={14} /> Upload XML feed
            </button>
            <input ref={fileInputRef} type="file" accept=".xml" hidden onChange={onFileChosen} />
            <button className="upload-btn" onClick={() => submitXml(SAMPLE_VALID, "sample-valid.xml")} disabled={busy}
              style={{ background: COLORS.panelRaised, color: COLORS.textPrimary, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, cursor: "pointer" }}>
              Try a clean sample
            </button>
            <button className="upload-btn" onClick={() => submitXml(SAMPLE_ERRORS, "sample-errors.xml")} disabled={busy}
              style={{ background: COLORS.panelRaised, color: COLORS.textPrimary, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: "8px 12px", fontSize: 12.5, cursor: "pointer" }}>
              Try a broken sample
            </button>
            {error && <span style={{ color: COLORS.red, fontSize: 12, alignSelf: "center" }}>{error}</span>}
          </div>

          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `1px solid ${COLORS.line}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Signal size={14} color={COLORS.cyan} />
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13 }}>
                  {feed ? `Feed #${feed.id} — ${partner?.name || ""}` : "No feed submitted yet"}
                </span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: COLORS.textMuted }}>
                {feed ? `${feed.schema_version} · XML` : ""}
              </span>
            </div>

            {results.length > 0 ? (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: COLORS.panelRaised }}>
                    {["Field", "Type", "Value", "Signal", ""].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "8px 16px", fontSize: 11, color: COLORS.textMuted, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 400 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.field} style={{ borderTop: `1px solid ${COLORS.line}` }}>
                      <td style={{ padding: "9px 16px", fontFamily: "'IBM Plex Mono',monospace" }}>{r.field}</td>
                      <td style={{ padding: "9px 16px", color: COLORS.textMuted }}>{r.type}</td>
                      <td style={{ padding: "9px 16px", color: r.status === "fail" ? COLORS.red : COLORS.textPrimary, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.value}</td>
                      <td style={{ padding: "9px 16px" }}><SignalBars status={r.status} /></td>
                      <td style={{ padding: "9px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <StatusIcon status={r.status} />
                          {r.note && <span style={{ fontSize: 11, color: COLORS.textMuted }}>{r.note}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: 24, color: COLORS.textMuted, fontSize: 13 }}>
                Upload an XML feed or try a sample to see live validation results.
              </div>
            )}
          </div>
        </div>

        {/* Right: analytics */}
        <div style={{ flex: "1 1 300px", minWidth: 280, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Activity size={14} color={COLORS.cyan} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13 }}>Top failing fields · 7d</span>
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={failingFields} layout="vertical" margin={{ left: 0, right: 8, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} horizontal={false} />
                  <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 10 }} axisLine={{ stroke: COLORS.line }} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="field" tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: "IBM Plex Mono" }} axisLine={{ stroke: COLORS.line }} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: COLORS.panelRaised, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12 }} cursor={{ fill: COLORS.panelRaised }} />
                  <Bar dataKey="count" fill={COLORS.cyan} radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.line}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Database size={14} color={COLORS.cyan} />
              <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, fontSize: 13 }}>Underlying query</span>
            </div>
            <pre style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11.5, color: COLORS.textMuted, background: COLORS.void, border: `1px solid ${COLORS.line}`, borderRadius: 8, padding: 12, margin: 0, overflowX: "auto", lineHeight: 1.6 }}>
              {sql}
            </pre>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div style={{ borderTop: `1px solid ${COLORS.line}`, background: COLORS.panel, padding: "10px 0", overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 16px", borderRight: `1px solid ${COLORS.line}`, marginRight: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.red }} />
          <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: COLORS.textMuted, letterSpacing: 0.5 }}>LIVE ACTIVITY</span>
        </div>
        <div style={{ overflow: "hidden", flex: 1 }}>
          <div className="scan-track" style={{ display: "flex", width: "max-content", gap: 40 }}>
            {[...events, ...events].map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", fontSize: 12.5 }}>
                <StatusIcon status={e.level} />
                <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{e.partner_name}</span>
                <span style={{ color: COLORS.textMuted }}>{e.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
