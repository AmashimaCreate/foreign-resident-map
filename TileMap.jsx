import React from "react";

/* =========================================================================
   タイル地図（簡易グリッド配置）。リアル地図(JapanMap)と切替できるよう復活。
   色・テキスト・選択は親(App)の関数(colorFor/textFor/isDarkFor)を流用（描画のみ）。
   ========================================================================= */

// 地理的グリッド配置 [row, col]
const GRID = {
 "01":[0,10],"02":[1,9],"03":[2,9],"04":[3,9],"05":[2,8],"06":[3,8],"07":[4,9],
 "08":[5,9],"09":[4,8],"10":[5,7],"11":[5,8],"12":[6,9],"13":[6,8],"14":[7,8],
 "15":[4,7],"16":[4,6],"17":[3,5],"18":[4,5],"19":[6,6],"20":[5,6],"21":[5,5],
 "22":[7,6],"23":[6,5],"24":[5,4],"25":[4,4],"26":[4,3],"27":[5,3],"28":[5,2],
 "29":[6,4],"30":[6,3],"31":[4,2],"32":[4,1],"33":[5,1],"34":[5,0],"35":[4,0],
 "36":[9,4],"37":[8,4],"38":[8,3],"39":[9,3],"40":[7,1],"41":[7,0],"42":[8,0],
 "43":[10,0],"44":[8,1],"45":[9,1],"46":[9,0],"47":[12,0]
};

export default function TileMap({ prefs, colorFor, textFor, isDarkFor, titleFor, selectedCode, onSelect }) {
  return (
    // aspectRatio で各行を等高にし、空セルも面積を持たせて地理形状を崩さない＝整然と見せる
    <div style={{display:"grid", gridTemplateColumns:"repeat(11,1fr)", gridTemplateRows:"repeat(13,1fr)",
      gap:4, aspectRatio:"11 / 13"}}>
      {prefs.map(p=>{
        const [r,c]=GRID[p.code]; const isSel=selectedCode===p.code;
        return (
          <div key={p.code} onClick={()=>onSelect(p)}
            title={titleFor?titleFor(p):undefined}
            style={{gridRow:r+1, gridColumn:c+1, background:colorFor(p), borderRadius:5,
              cursor:"pointer", overflow:"hidden", display:"flex", flexDirection:"column",
              justifyContent:"center", alignItems:"center", color:isDarkFor(p)?"#fff":"#333",
              border:isSel?"2px solid #111":"1px solid rgba(0,0,0,.10)",
              position:"relative", zIndex:isSel?2:1,
              boxShadow:isSel?"0 1px 6px rgba(0,0,0,.30)":"none", transition:"box-shadow .1s"}}>
            <span style={{fontSize:10, fontWeight:700, lineHeight:1.05, textAlign:"center", whiteSpace:"nowrap"}}>{p.name.replace(/[都府県]$/,"")}</span>
            <span style={{fontSize:9, lineHeight:1.2, opacity:.92}}>{textFor(p)}</span>
          </div>
        );
      })}
    </div>
  );
}
