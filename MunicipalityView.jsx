import React, { useState, useEffect, useMemo } from "react";

/* =========================================================================
   市区町村ドリルダウン（都道府県マップの下位階層）
   データ: municipalities.json（外国人2025.6 / 人口2025.1 住基）
   - munis: 市区町村（比率降順）。政令市・特別区は wards に区の内訳を持つ。
   - 168KB のため初回表示時に動的import（メインバンドルを軽く保つ）。
   - 既存 foreign-resident-map.jsx のロジック・データには一切手を入れない。
   ========================================================================= */

// 比率/人数→色（薄→濃赤）: 都道府県マップと同じ赤系グラデーション
function colRatio(v, max) {
  const t = Math.min((v || 0) / (max || 1), 1), a = [255, 247, 236], b = [127, 0, 0];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const yen = (n) => (n == null ? "—" : n.toLocaleString("ja-JP"));
const fmtK = (n) =>
  n == null ? "—" : n >= 10000 ? (n / 10000).toFixed(1) + "万" : n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n);

export default function MunicipalityView({ pref, onClose }) {
  const [MUNI, setMUNI] = useState(null);
  const [loadErr, setLoadErr] = useState(false);
  const [metric, setMetric] = useState("ratio");   // ratio | count
  const [wardMode, setWardMode] = useState(false);  // 政令市・特別区を区に展開
  const [selCode, setSelCode] = useState(null);     // 選択中の自治体 code

  // 168KB は初回ドリルダウン時のみ動的import（Viteが別チャンクに分割）
  useEffect(() => {
    let alive = true;
    import("./municipalities.json")
      .then((m) => alive && setMUNI(m.default || m))
      .catch(() => alive && setLoadErr(true));
    return () => { alive = false; };
  }, []);

  // Esc で閉じる
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const muniPref = useMemo(
    () => (MUNI ? MUNI.prefs.find((p) => p.code === pref.code) : null),
    [MUNI, pref.code]
  );
  const hasSeirei = useMemo(
    () => !!muniPref && muniPref.munis.some((m) => m.wards && m.wards.length),
    [muniPref]
  );

  // 表示単位: 市単位 = munis そのまま / 区単位 = 政令市・特別区を wards に展開
  const units = useMemo(() => {
    if (!muniPref) return [];
    const base = muniPref.munis;
    return wardMode
      ? base.flatMap((m) => (m.wards && m.wards.length ? m.wards : [m]))
      : base;
  }, [muniPref, wardMode]);

  const mval = (u) => (metric === "ratio" ? u.ratio : u.foreign);
  const valid = useMemo(() => units.filter((u) => u.ratio != null && u.foreign != null), [units]);
  const hidden = useMemo(() => units.filter((u) => u.ratio == null || u.foreign == null), [units]);
  const sorted = useMemo(
    () => [...valid].sort((a, b) => (metric === "ratio" ? b.ratio - a.ratio : b.foreign - a.foreign)),
    [valid, metric]
  );
  const maxV = sorted.length ? mval(sorted[0]) : 1;
  const selUnit = useMemo(
    () => units.find((u) => u.code === selCode) || sorted[0] || null,
    [units, selCode, sorted]
  );
  const selRank = selUnit ? sorted.findIndex((u) => u.code === selUnit.code) + 1 : 0;

  // ---- styles ----
  const overlay = {
    position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 1000,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    fontFamily: "'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
  };
  const panel = {
    background: "#f4f1ea", borderRadius: 12, width: "min(920px, 96vw)", maxHeight: "92vh",
    display: "flex", flexDirection: "column", overflow: "hidden", color: "#1a1a1a",
    boxShadow: "0 10px 40px rgba(0,0,0,.35)",
  };
  const pill = (active) => ({
    fontSize: 11, padding: "4px 10px", borderRadius: 14, cursor: "pointer",
    border: "1px solid #7f0000", background: active ? "#7f0000" : "#fff", color: active ? "#fff" : "#7f0000",
  });
  const cellBox = {
    borderRadius: 4, padding: "4px 2px", minHeight: 38, display: "flex", flexDirection: "column",
    justifyContent: "center", alignItems: "center",
  };
  const nameSpan = {
    fontSize: 9.5, fontWeight: 700, lineHeight: 1.1, textAlign: "center",
    maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  };

  return (
    <div onClick={onClose} style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={panel}>

        {/* ヘッダー + コントロール（固定） */}
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2dccd", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: 17 }}>
              {pref.name}　<span style={{ fontSize: 12, color: "#888" }}>市区町村ドリルダウン</span>
            </h2>
            <button onClick={onClose} aria-label="閉じる"
              style={{ border: "none", background: "transparent", fontSize: 24, lineHeight: 1, cursor: "pointer", color: "#777" }}>×</button>
          </div>

          {MUNI && muniPref && (
            <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", gap: 4 }}>
                {[["ratio", "比率%"], ["count", "人数"]].map(([k, l]) => (
                  <button key={k} onClick={() => setMetric(k)} style={pill(metric === k)}>{l}</button>
                ))}
              </div>
              {hasSeirei && (
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => setWardMode(false)} style={pill(!wardMode)}>市単位</button>
                  <button onClick={() => setWardMode(true)} style={pill(wardMode)}>区単位</button>
                </div>
              )}
              <span style={{ fontSize: 11, color: "#888" }}>{units.length}自治体</span>
            </div>
          )}
        </div>

        {/* 本体（スクロール） */}
        <div style={{ padding: 16, overflowY: "auto", flex: 1, minHeight: 0 }}>
          {loadErr ? (
            <div style={{ padding: 24, textAlign: "center", color: "#a00" }}>データの読み込みに失敗しました。</div>
          ) : !MUNI ? (
            <div style={{ padding: 24, textAlign: "center", color: "#888" }}>読み込み中…</div>
          ) : !muniPref ? (
            <div style={{ padding: 24, textAlign: "center", color: "#888" }}>この都道府県の市区町村データはありません。</div>
          ) : (
            <>
              {/* 選択中の自治体 */}
              {selUnit && (
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                  <Stat label="自治体" value={selUnit.name} />
                  <Stat label="外国人" value={yen(selUnit.foreign) + "人"} />
                  <Stat label="人口" value={yen(selUnit.pop)} small />
                  <Stat label="比率" value={selUnit.ratio != null ? selUnit.ratio.toFixed(2) + "%" : "—"} accent />
                  <Stat label={metric === "ratio" ? "比率順位" : "人数順位"} value={selRank + " / " + sorted.length + "位"} small />
                </div>
              )}

              {/* ミニ地図（簡易グリッド） */}
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                ミニ地図（簡易グリッド・{metric === "ratio" ? "比率" : "外国人数"}が高いほど濃い赤／タップで選択）
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))", gap: 3, marginBottom: 18 }}>
                {sorted.map((u) => {
                  const v = mval(u), dark = v > maxV * 0.55, isSel = selUnit && u.code === selUnit.code;
                  return (
                    <div key={u.code} onClick={() => setSelCode(u.code)}
                      title={`${u.name}　比率${u.ratio.toFixed(2)}% / ${yen(u.foreign)}人 / 人口${yen(u.pop)}`}
                      style={{ ...cellBox, background: colRatio(v, maxV), color: dark ? "#fff" : "#333", cursor: "pointer",
                        border: isSel ? "2px solid #111" : "1px solid rgba(0,0,0,.12)",
                        transform: isSel ? "scale(1.05)" : "none", transition: "transform .1s" }}>
                      <span style={nameSpan}>{u.name}</span>
                      <span style={{ fontSize: 9, lineHeight: 1.3 }}>{metric === "ratio" ? u.ratio.toFixed(1) + "%" : fmtK(u.foreign)}</span>
                    </div>
                  );
                })}
                {hidden.map((u) => (
                  <div key={u.code} title={`${u.name}　データなし（秘匿）`}
                    style={{ ...cellBox, background: "#e7e2d6", color: "#999", border: "1px dashed #c9c2b2" }}>
                    <span style={nameSpan}>{u.name}</span>
                    <span style={{ fontSize: 8 }}>—</span>
                  </div>
                ))}
              </div>

              {/* ランキング一覧 */}
              <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
                ランキング（{metric === "ratio" ? "比率" : "外国人数"}・降順）
              </div>
              <div>
                {sorted.map((u, i) => {
                  const isSel = selUnit && u.code === selUnit.code;
                  return (
                    <div key={u.code} onClick={() => setSelCode(u.code)}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 4px", cursor: "pointer",
                        background: isSel ? "#faf3f3" : "transparent", borderRadius: 4 }}>
                      <span style={{ width: 26, fontSize: 11, color: "#999", textAlign: "right" }}>{i + 1}</span>
                      <span style={{ flex: "0 0 118px", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                      <div style={{ flex: 1, background: "#e7e1d4", borderRadius: 4, height: 14, minWidth: 36 }}>
                        <div style={{ width: `${Math.max((mval(u) / maxV) * 100, 2)}%`, background: colRatio(mval(u), maxV), height: "100%", borderRadius: 4 }} />
                      </div>
                      <span style={{ flex: "0 0 92px", fontSize: 11, textAlign: "right" }}>
                        {metric === "ratio" ? u.ratio.toFixed(2) + "%" : yen(u.foreign) + "人"}
                      </span>
                    </div>
                  );
                })}
                {hidden.map((u) => (
                  <div key={u.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 4px", color: "#aaa" }}>
                    <span style={{ width: 26 }} />
                    <span style={{ flex: "0 0 118px", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ flex: "0 0 92px", fontSize: 10, textAlign: "right" }}>データなし</span>
                  </div>
                ))}
              </div>

              {/* 出典 */}
              <div style={{ fontSize: 10, color: "#999", marginTop: 16, lineHeight: 1.7, borderTop: "1px solid #e2dccd", paddingTop: 10 }}>
                <b>出典</b>　外国人2025.6 / 人口2025.1（住基）。市区町村別の在留外国人数（出入国在留管理庁）と住民基本台帳人口（総務省）。<br />
                <b>注</b>　比率＝外国人数 ÷ 人口 × 100。政令指定都市は市本体＝区の合算値、東京は「特別区」＝23区の合算（「区単位」で内訳を展開）。数値が秘匿の自治体は「データなし」と表示。地理座標が無いためミニ地図は簡易グリッド（将来SVG差し替え予定）。
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent, small }) {
  return (
    <div style={{ background: accent ? "#7f0000" : "#fff", color: accent ? "#fff" : "#333",
      borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 64,
      border: accent ? "none" : "1px solid #e6e0d2" }}>
      <div style={{ fontSize: 9, opacity: .75 }}>{label}</div>
      <div style={{ fontSize: small ? 12 : 14, fontWeight: 700, marginTop: 2 }}>{value}</div>
    </div>
  );
}
