import React from "react";

/* =========================================================================
   タイル地図（簡易グリッド配置）。リアル地図(JapanMap)と切替できるよう復活。
   色・テキスト・選択は親(App)の関数(colorFor/textFor/isDarkFor)を流用（描画のみ）。
   ========================================================================= */

// 地理的グリッド配置 [row, col]
const GRID = {
 "01":[0,9],"02":[1,9],"03":[2,10],"04":[2,9],"05":[1,8],"06":[2,8],"07":[3,9],
 "08":[4,9],"09":[3,8],"10":[3,7],"11":[4,8],"12":[5,9],"13":[5,8],"14":[6,8],
 "15":[3,6],"16":[4,5],"17":[3,5],"18":[4,4],"19":[5,7],"20":[4,6],"21":[5,5],
 "22":[6,6],"23":[6,5],"24":[6,4],"25":[5,4],"26":[5,3],"27":[6,3],"28":[6,2],
 "29":[7,4],"30":[7,3],"31":[5,1],"32":[5,0],"33":[6,1],"34":[6,0],"35":[7,0],
 "36":[7,2],"37":[7,1],"38":[8,1],"39":[8,2],"40":[8,0],"41":[9,0],"42":[10,0],
 "43":[10,1],"44":[9,1],"45":[11,1],"46":[11,0],"47":[12,0]
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
