import React, { useRef, useEffect, useMemo } from "react";
import SVG from "./japan-prefectures.svg?raw";

/* =========================================================================
   本物の日本地図SVG（Geolonia「japanese-prefectures」, GFDL）
   各 <g data-code="13"> に既存の都道府県データ(code)を突き合わせ、塗り分け＋タップ選択。
   ※ DATA定数・比率/人数/増減の算出ロジックは一切変更しない（描画のみ）。
      色は既存の cellColor を colorFor として受け取り流用する。
   ========================================================================= */
// GeoloniaのSVGは data-code が非ゼロ詰め("1".."47")。DATAは "01".."47" なので2桁に揃える。
const codeOf = (g) => (g.getAttribute("data-code") || "").padStart(2, "0");

export default function JapanMap({ prefs, colorFor, titleFor, selectedCode, onSelect }) {
  const ref = useRef(null);
  const byCode = useMemo(() => Object.fromEntries(prefs.map((p) => [p.code, p])), [prefs]);

  // SVGを一度だけ注入し、画面幅にフィットさせる
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = SVG;
    const svg = root.querySelector("svg");
    if (svg) {
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "auto";
      svg.style.display = "block";
    }
  }, []);

  // 塗り分け・選択強調・ホバーツールチップ（metric / 選択が変わるたびに再適用）
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll("g[data-code]").forEach((g) => {
      const p = byCode[codeOf(g)];
      if (!p) return;
      g.setAttribute("fill", colorFor(p));
      g.style.cursor = "pointer";
      g.style.transition = "fill .15s";
      const sel = codeOf(g) === selectedCode;
      g.style.stroke = sel ? "#111" : "rgba(0,0,0,.4)";
      g.style.strokeWidth = sel ? "3" : "0.8";
      if (titleFor) {
        let t = g.querySelector("title");
        if (!t) {
          t = document.createElementNS("http://www.w3.org/2000/svg", "title");
          g.insertBefore(t, g.firstChild);
        }
        t.textContent = titleFor(p);
      }
      if (sel) g.parentNode.appendChild(g); // 選択県を前面へ
    });
  }, [byCode, colorFor, titleFor, selectedCode]);

  // クリック委譲（小さい県でも親<g>で確実に拾う）
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onClick = (e) => {
      const g = e.target.closest && e.target.closest("g[data-code]");
      if (!g) return;
      const p = byCode[codeOf(g)];
      if (p) onSelect(p);
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [byCode, onSelect]);

  return (
    <div ref={ref} role="img" aria-label="日本地図（都道府県別の塗り分け・タップで選択）"
      style={{ width: "100%" }} />
  );
}
