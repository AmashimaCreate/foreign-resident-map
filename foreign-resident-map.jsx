import React, { useState, useMemo, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import MunicipalityView from "./MunicipalityView.jsx";
import JapanMap from "./JapanMap.jsx";
import TileMap from "./TileMap.jsx";

/* =========================================================================
   外国人比率マップ（実データ版）
   外国人数: 出入国在留管理庁「在留外国人統計」 2023年12月〜2025年6月（4時点・実数）
   総人口  : 総務省「人口推計」2024年10月1日現在（実数）
   帰化    : 法務省「帰化許可者数等の推移」（全国・暦年）
   比率 = 在留外国人数(2025.6) ÷ 総人口(2024.10) × 100
   ========================================================================= */

const DATA = {"prefs":[{"code":"01","name":"北海道","pop":5043000,"series":{"2023-12":56485,"2024-06":60273,"2024-12":67484,"2025-06":69620}},{"code":"02","name":"青森県","pop":1165000,"series":{"2023-12":7797,"2024-06":8045,"2024-12":8603,"2025-06":8949}},{"code":"03","name":"岩手県","pop":1145000,"series":{"2023-12":10173,"2024-06":10644,"2024-12":11366,"2025-06":11775}},{"code":"04","name":"宮城県","pop":2248000,"series":{"2023-12":27009,"2024-06":28330,"2024-12":29878,"2025-06":31041}},{"code":"05","name":"秋田県","pop":897000,"series":{"2023-12":5280,"2024-06":5571,"2024-12":5851,"2025-06":6097}},{"code":"06","name":"山形県","pop":1011000,"series":{"2023-12":9326,"2024-06":10058,"2024-12":10535,"2025-06":10753}},{"code":"07","name":"福島県","pop":1743000,"series":{"2023-12":18070,"2024-06":18936,"2024-12":20022,"2025-06":20708}},{"code":"08","name":"茨城県","pop":2806000,"series":{"2023-12":91694,"2024-06":97038,"2024-12":102549,"2025-06":106490}},{"code":"09","name":"栃木県","pop":1885000,"series":{"2023-12":51073,"2024-06":54493,"2024-12":56983,"2025-06":59809}},{"code":"10","name":"群馬県","pop":1890000,"series":{"2023-12":74154,"2024-06":79470,"2024-12":83430,"2025-06":87299}},{"code":"11","name":"埼玉県","pop":7332000,"series":{"2023-12":234698,"2024-06":249327,"2024-12":262382,"2025-06":277209}},{"code":"12","name":"千葉県","pop":6251000,"series":{"2023-12":204091,"2024-06":219131,"2024-12":231614,"2025-06":247580}},{"code":"13","name":"東京都","pop":14178000,"series":{"2023-12":663362,"2024-06":701955,"2024-12":738946,"2025-06":775340}},{"code":"14","name":"神奈川県","pop":9225000,"series":{"2023-12":267523,"2024-06":280020,"2024-12":292450,"2025-06":306363}},{"code":"15","name":"新潟県","pop":2099000,"series":{"2023-12":21558,"2024-06":22139,"2024-12":24283,"2025-06":24737}},{"code":"16","name":"富山県","pop":997000,"series":{"2023-12":22460,"2024-06":23382,"2024-12":24314,"2025-06":25311}},{"code":"17","name":"石川県","pop":1098000,"series":{"2023-12":19407,"2024-06":20234,"2024-12":21151,"2025-06":22294}},{"code":"18","name":"福井県","pop":739000,"series":{"2023-12":17595,"2024-06":18937,"2024-12":19898,"2025-06":20783}},{"code":"19","name":"山梨県","pop":791000,"series":{"2023-12":21502,"2024-06":22547,"2024-12":23691,"2025-06":24392}},{"code":"20","name":"長野県","pop":1987000,"series":{"2023-12":43075,"2024-06":44834,"2024-12":46850,"2025-06":48288}},{"code":"21","name":"岐阜県","pop":1916000,"series":{"2023-12":69477,"2024-06":71617,"2024-12":74750,"2025-06":77301}},{"code":"22","name":"静岡県","pop":3527000,"series":{"2023-12":115642,"2024-06":120314,"2024-12":124281,"2025-06":128311}},{"code":"23","name":"愛知県","pop":7460000,"series":{"2023-12":310845,"2024-06":321041,"2024-12":331733,"2025-06":345900}},{"code":"24","name":"三重県","pop":1711000,"series":{"2023-12":64420,"2024-06":66509,"2024-12":68804,"2025-06":71154}},{"code":"25","name":"滋賀県","pop":1402000,"series":{"2023-12":40743,"2024-06":41490,"2024-12":42960,"2025-06":44345}},{"code":"26","name":"京都府","pop":2520000,"series":{"2023-12":75818,"2024-06":79617,"2024-12":83914,"2025-06":88337}},{"code":"27","name":"大阪府","pop":8757000,"series":{"2023-12":301490,"2024-06":317421,"2024-12":333564,"2025-06":360390}},{"code":"28","name":"兵庫県","pop":5337000,"series":{"2023-12":131756,"2024-06":137044,"2024-12":142676,"2025-06":148569}},{"code":"29","name":"奈良県","pop":1285000,"series":{"2023-12":17614,"2024-06":18320,"2024-12":19257,"2025-06":20411}},{"code":"30","name":"和歌山県","pop":880000,"series":{"2023-12":9090,"2024-06":9572,"2024-12":10144,"2025-06":10736}},{"code":"31","name":"鳥取県","pop":531000,"series":{"2023-12":5604,"2024-06":5864,"2024-12":6068,"2025-06":6315}},{"code":"32","name":"島根県","pop":642000,"series":{"2023-12":10350,"2024-06":10686,"2024-12":11089,"2025-06":11652}},{"code":"33","name":"岡山県","pop":1831000,"series":{"2023-12":35928,"2024-06":37129,"2024-12":38886,"2025-06":40130}},{"code":"34","name":"広島県","pop":2714000,"series":{"2023-12":62363,"2024-06":64419,"2024-12":67837,"2025-06":69897}},{"code":"35","name":"山口県","pop":1281000,"series":{"2023-12":19622,"2024-06":20649,"2024-12":21581,"2025-06":21866}},{"code":"36","name":"徳島県","pop":685000,"series":{"2023-12":7949,"2024-06":8321,"2024-12":8907,"2025-06":9190}},{"code":"37","name":"香川県","pop":917000,"series":{"2023-12":17312,"2024-06":18415,"2024-12":19607,"2025-06":20671}},{"code":"38","name":"愛媛県","pop":1276000,"series":{"2023-12":16384,"2024-06":17439,"2024-12":18687,"2025-06":19069}},{"code":"39","name":"高知県","pop":656000,"series":{"2023-12":6129,"2024-06":6379,"2024-12":6848,"2025-06":6996}},{"code":"40","name":"福岡県","pop":5092000,"series":{"2023-12":99695,"2024-06":105049,"2024-12":113159,"2025-06":119392}},{"code":"41","name":"佐賀県","pop":788000,"series":{"2023-12":9764,"2024-06":10378,"2024-12":11358,"2025-06":11953}},{"code":"42","name":"長崎県","pop":1252000,"series":{"2023-12":13590,"2024-06":14277,"2024-12":15692,"2025-06":16393}},{"code":"43","name":"熊本県","pop":1697000,"series":{"2023-12":25589,"2024-06":27407,"2024-12":29385,"2025-06":30825}},{"code":"44","name":"大分県","pop":1085000,"series":{"2023-12":18108,"2024-06":18954,"2024-12":20330,"2025-06":21708}},{"code":"45","name":"宮崎県","pop":1033000,"series":{"2023-12":9752,"2024-06":10494,"2024-12":11511,"2025-06":12147}},{"code":"46","name":"鹿児島県","pop":1532000,"series":{"2023-12":16417,"2024-06":17358,"2024-12":18972,"2025-06":20032}},{"code":"47","name":"沖縄県","pop":1466000,"series":{"2023-12":25447,"2024-06":26996,"2024-12":29384,"2025-06":31249}}],"nationality":[{"name":"中国","v":900738},{"name":"ベトナム","v":660483},{"name":"韓国","v":409584},{"name":"フィリピン","v":349714},{"name":"ネパール","v":273229},{"name":"インドネシア","v":230689},{"name":"ブラジル","v":211229},{"name":"ミャンマー","v":160362},{"name":"その他","v":760591}],"national_trend":[{"year":"2015","total":2232189},{"year":"2016","total":2382822},{"year":"2017","total":2561848},{"year":"2018","total":2731093},{"year":"2019","total":2933137},{"year":"2020","total":2887116},{"year":"2021","total":2760635},{"year":"2022","total":3075213},{"year":"2023","total":3410992},{"year":"2024","total":3768977},{"year":"25.6","total":3956619}],"naturalization":[{"year":"2019","n":8453},{"year":"2020","n":9079},{"year":"2021","n":8167},{"year":"2022","n":7059},{"year":"2023","n":8800},{"year":"2024","n":9100}]};

// 地図は本物の日本地図SVG（Geolonia「japanese-prefectures」, GFDL）に置換。
// 旧・簡易グリッド配置(GRID)は廃止。

const TIMES = ["2023-12","2024-06","2024-12","2025-06"];
const TLABEL = {"2023-12":"23.12","2024-06":"24.6","2024-12":"24.12","2025-06":"25.6"};
const LATEST = "2025-06";

const ratio = (p)=> p.series[LATEST]/p.pop*100;
const growth = (p)=> (p.series[LATEST]-p.series["2023-12"])/p.series["2023-12"]*100; // 1.5年増減率
const yen = (n)=> n==null? "—" : n.toLocaleString("ja-JP");

// 比率→色（薄→濃赤）
function colRatio(v,max){
  const t=Math.min(v/max,1), a=[255,247,236], b=[127,0,0];
  const c=a.map((x,i)=>Math.round(x+(b[i]-x)*t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
// 増減率→色（青=低い〜赤=高い、発散）
function colGrowth(v,min,max){
  const t=(v-min)/(max-min||1), a=[33,120,180], mid=[245,245,235], b=[200,40,40];
  const lerp=(x,y,k)=>Math.round(x+(y-x)*k);
  let c; if(t<0.5){const k=t/0.5; c=a.map((x,i)=>lerp(x,mid[i],k));}
  else{const k=(t-0.5)/0.5; c=mid.map((x,i)=>lerp(x,b[i],k));}
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

const NAT_COLORS=["#c0392b","#e67e22","#f1c40f","#27ae60","#16a085","#2980b9","#8e44ad","#7f8c8d","#bdc3c7"];

// 画面幅で 1カラム/2カラム を切り替えるためのフック（レイアウトのみ）
function useIsNarrow(bp=760){
  const [narrow,setNarrow]=useState(typeof window!=="undefined" ? window.innerWidth<bp : false);
  useEffect(()=>{
    const onResize=()=>setNarrow(window.innerWidth<bp);
    onResize();
    window.addEventListener("resize",onResize);
    return ()=>window.removeEventListener("resize",onResize);
  },[bp]);
  return narrow;
}

// 詳細パネルへ「ぬるっと」スクロール（native smoothが無効な環境でも動くよう自前アニメ）
function smoothScrollToY(targetY, duration=480){
  try{
    const startY = window.scrollY || document.documentElement.scrollTop || 0;
    const dist = targetY - startY;
    if(Math.abs(dist) < 4) return;
    let start = null;
    const ease = (t)=> t<0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; // easeInOutCubic
    const step = (ts)=>{
      if(start===null) start=ts;
      const p = Math.min((ts-start)/duration, 1);
      window.scrollTo(0, Math.round(startY + dist*ease(p)));
      if(p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }catch(e){}
}

export default function App(){
  const [sel,setSel]=useState(DATA.prefs.find(p=>p.name==="東京都"));
  const [metric,setMetric]=useState("ratio"); // ratio | count | growth
  const [showMuni,setShowMuni]=useState(false); // 市区町村ドリルダウン（別データ・別コンポーネント）
  const narrow=useIsNarrow(); // スマホ幅判定（レイアウトのみ）
  const [mapStyle,setMapStyle]=useState("real"); // real(リアル地図SVG) | tile(タイル地図)
  const detailRef=useRef(null);
  const selectPref=(p)=>{ // 県を選択→スマホ(縦積み)では詳細パネルへ"ぬるっと"スクロール
    setSel(p);
    if(narrow && detailRef.current){
      const y = detailRef.current.getBoundingClientRect().top + (window.scrollY||0) - 8;
      smoothScrollToY(y, 480);
    }
  };

  const maxRatio=useMemo(()=>Math.max(...DATA.prefs.map(ratio)),[]);
  const maxCount=useMemo(()=>Math.max(...DATA.prefs.map(p=>p.series[LATEST])),[]);
  const gVals=useMemo(()=>DATA.prefs.map(growth),[]);
  const gMin=Math.min(...gVals), gMax=Math.max(...gVals);

  const sortedByRatio=useMemo(()=>[...DATA.prefs].sort((a,b)=>ratio(b)-ratio(a)),[]);
  const sortedByGrowth=useMemo(()=>[...DATA.prefs].sort((a,b)=>growth(b)-growth(a)),[]);
  const sortedByCount=useMemo(()=>[...DATA.prefs].sort((a,b)=>b.series[LATEST]-a.series[LATEST]),[]);
  const totalForeign=DATA.national_trend[DATA.national_trend.length-1].total; // 全国計(25.6)＝推移グラフと一致
  const ratioHi=sortedByRatio[0], ratioLo=sortedByRatio[sortedByRatio.length-1];
  const countHi=sortedByCount[0], countLo=sortedByCount[sortedByCount.length-1];

  const cellColor=(p)=>{
    if(metric==="ratio") return colRatio(ratio(p),maxRatio);
    if(metric==="count") return colRatio(p.series[LATEST],maxCount);
    return colGrowth(growth(p),gMin,gMax);
  };
  // タイル地図のセル文字・濃淡（リアル/タイル切替のため復活。描画のみ）
  const cellText=(p)=>{
    if(metric==="ratio") return ratio(p).toFixed(2)+"%";
    if(metric==="count") return (p.series[LATEST]/1000).toFixed(0)+"k";
    return "+"+growth(p).toFixed(0)+"%";
  };
  const isDark=(p)=>{
    if(metric==="ratio") return ratio(p)>maxRatio*0.55;
    if(metric==="count") return p.series[LATEST]>maxCount*0.55;
    return growth(p)>gMin+(gMax-gMin)*0.7 || growth(p)<gMin+(gMax-gMin)*0.25;
  };

  const selTrend=TIMES.map(t=>({year:TLABEL[t], v:sel.series[t]}));
  const selRatioRank=sortedByRatio.findIndex(p=>p.code===sel.code)+1;
  const selGrowth=growth(sel);

  return (
    <div style={{fontFamily:"'Hiragino Kaku Gothic ProN','Noto Sans JP',sans-serif",
      background:"#f4f1ea", minHeight:"100vh", padding:"20px 16px", color:"#1a1a1a"}}>
      <div style={{maxWidth:1100, margin:"0 auto"}}>
        {/* recharts要素のクリック時フォーカス枠（円グラフの謎の枠）を消す */}
        <style>{`.recharts-sector:focus,.recharts-surface:focus,.recharts-wrapper svg:focus,.recharts-layer:focus,.recharts-pie:focus{outline:none}`}</style>

        <div style={{borderLeft:"5px solid #7f0000", paddingLeft:14, marginBottom:14}}>
          <h1 style={{margin:0, fontSize:28, letterSpacing:1}}>外国人比率マップ</h1>
          <div style={{fontSize:14, color:"#666", marginTop:3}}>
            都道府県別　在留外国人の比率・人数・増減　｜　2025年6月末時点（実データ）
          </div>
        </div>

        {/* 全国サマリー（2025年6月末） */}
        <div style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)", marginBottom:18}}>
          <h2 style={{margin:"0 0 10px", fontSize:17}}>全国サマリー　<span style={{fontSize:12, color:"#888"}}>2025年6月末</span></h2>
          <div style={{display:"grid", gridTemplateColumns: narrow?"1fr 1fr":"1.4fr 1fr 1fr 1fr 1fr", gap:8}}>
            <SummaryStat label="在留外国人 累計" value={yen(totalForeign)+"人"} accent/>
            <SummaryStat label="比率 最高" name={ratioHi.name} value={ratio(ratioHi).toFixed(2)+"%"} onClick={()=>selectPref(ratioHi)}/>
            <SummaryStat label="比率 最低" name={ratioLo.name} value={ratio(ratioLo).toFixed(2)+"%"} onClick={()=>selectPref(ratioLo)}/>
            <SummaryStat label="人数 最多" name={countHi.name} value={yen(countHi.series[LATEST])+"人"} onClick={()=>selectPref(countHi)}/>
            <SummaryStat label="人数 最少" name={countLo.name} value={yen(countLo.series[LATEST])+"人"} onClick={()=>selectPref(countLo)}/>
          </div>
        </div>

        <div style={{display:"grid", gridTemplateColumns: narrow?"1fr":"1.3fr 1fr", gap:18, alignItems:"start"}}>
          {/* MAP */}
          <div style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
            {/* 見出し＋「地図の見た目」切替（リアル/タイル）を同じ行に */}
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8, flexWrap:"wrap", gap:6}}>
              <h2 style={{margin:0, fontSize:17}}>地図</h2>
              <div style={{display:"flex", gap:4}}>
                {[["real","リアル"],["tile","タイル"]].map(([k,l])=>(
                  <button key={k} onClick={()=>setMapStyle(k)}
                    style={{fontSize:13, padding:"4px 10px", borderRadius:14, cursor:"pointer",
                      border:"1px solid #7f0000", background:mapStyle===k?"#7f0000":"#fff",
                      color:mapStyle===k?"#fff":"#7f0000"}}>{l}</button>
                ))}
              </div>
            </div>
            {/* 「指標」切替（比率/人数/増減）は属性が違うので1段下に分離 */}
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:10, flexWrap:"wrap"}}>
              <span style={{fontSize:11, color:"#999"}}>指標</span>
              {[["ratio","比率%"],["count","人数"],["growth","増減率"]].map(([k,l])=>(
                <button key={k} onClick={()=>setMetric(k)}
                  style={{fontSize:13, padding:"4px 10px", borderRadius:14, cursor:"pointer",
                    border:"1px solid #3f5366", background:metric===k?"#3f5366":"#fff",
                    color:metric===k?"#fff":"#3f5366"}}>{l}</button>
              ))}
            </div>
            {mapStyle==="real" ? (
              <JapanMap prefs={DATA.prefs} colorFor={cellColor} selectedCode={sel.code} onSelect={selectPref}
                titleFor={(p)=>`${p.name}　比率${ratio(p).toFixed(2)}% / ${yen(p.series[LATEST])}人 / 増減+${growth(p).toFixed(0)}%`}/>
            ) : (
              <TileMap prefs={DATA.prefs} colorFor={cellColor} textFor={cellText} isDarkFor={isDark}
                selectedCode={sel.code} onSelect={selectPref}
                titleFor={(p)=>`${p.name} 比率${ratio(p).toFixed(2)}% / ${yen(p.series[LATEST])}人 / 増減+${growth(p).toFixed(0)}%`}/>
            )}
            <div style={{marginTop:12, display:"flex", alignItems:"center", gap:8, fontSize:12, color:"#666"}}>
              <span>{metric==="growth"?"低":"低"}</span>
              <div style={{flex:1, height:10, borderRadius:5, background:
                metric==="growth"?"linear-gradient(to right,#2178b4,#f5f5eb,#c82828)":"linear-gradient(to right,#fff7ec,#7f0000)"}}/>
              <span>高</span>
              <span style={{marginLeft:6}}>
                {metric==="ratio"&&`比率 最大${maxRatio.toFixed(2)}%`}
                {metric==="count"&&`人数 最大${yen(maxCount)}`}
                {metric==="growth"&&`増減 +${gMin.toFixed(0)}〜+${gMax.toFixed(0)}%`}
              </span>
            </div>
          </div>

          {/* DETAIL */}
          <div ref={detailRef} style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
            <h2 style={{margin:"0 0 8px", fontSize:17}}>{sel.name}　<span style={{fontSize:14,color:"#888"}}>詳細</span></h2>
            <div style={{display:"flex", gap:8, marginBottom:6, flexWrap:"wrap"}}>
              <Stat label="在留外国人(25.6)" value={yen(sel.series[LATEST])} />
              <Stat label="比率" value={ratio(sel).toFixed(2)+"%"} accent />
              <Stat label="比率順位" value={selRatioRank+"位"} />
            </div>
            <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
              <Stat label="総人口(24.10)" value={yen(sel.pop)} small />
              <Stat label="増減(23.12→25.6)" value={"+"+selGrowth.toFixed(1)+"%"} small />
            </div>
            <button onClick={()=>setShowMuni(true)}
              style={{width:"100%", marginBottom:12, padding:"9px 12px", borderRadius:8, cursor:"pointer",
                border:"1px solid #7f0000", background:"#7f0000", color:"#fff", fontSize:15, fontWeight:700}}>
              🔍 {sel.name}の市区町村を見る
            </button>
            <div style={{fontSize:13, color:"#666", marginBottom:2}}>在留外国人数の推移（実数・4時点）</div>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={selTrend} margin={{top:6,right:4,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
                <XAxis dataKey="year" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:12}} width={46} tickFormatter={(v)=>v>=10000?(v/10000).toFixed(0)+"万":(v/1000).toFixed(0)+"k"}/>
                <Tooltip formatter={(v)=>yen(v)+"人"}/>
                <Bar dataKey="v" fill="#7f0000" radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* rankings */}
        <div style={{display:"grid", gridTemplateColumns: narrow?"1fr":"1fr 1fr", gap:18, marginTop:18}}>
          <RankCard title="比率ランキング TOP10" rows={sortedByRatio.slice(0,10)}
            value={(p)=>ratio(p).toFixed(2)+"%"} frac={(p)=>ratio(p)/maxRatio}
            color={(p)=>colRatio(ratio(p),maxRatio)} onSel={setSel} sel={sel}/>
          <RankCard title="増減率ランキング TOP10（23.12→25.6）" rows={sortedByGrowth.slice(0,10)}
            value={(p)=>"+"+growth(p).toFixed(1)+"%"} frac={(p)=>(growth(p)-gMin)/(gMax-gMin)}
            color={(p)=>colGrowth(growth(p),gMin,gMax)} onSel={setSel} sel={sel}/>
        </div>

        {/* national trend + nationality */}
        <div style={{display:"grid", gridTemplateColumns: narrow?"1fr":"1fr 1fr", gap:18, marginTop:18}}>
          <div style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
            <h2 style={{margin:"0 0 4px", fontSize:17}}>全国 在留外国人数の推移</h2>
            <div style={{fontSize:12, color:"#999", marginBottom:4}}>各年末＋2025年6月末・実数（出入国在留管理庁）</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={DATA.national_trend} margin={{top:6,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
                <XAxis dataKey="year" tick={{fontSize:12}}/>
                <YAxis tick={{fontSize:12}} width={42} tickFormatter={(v)=>(v/1000000).toFixed(1)+"M"}/>
                <Tooltip formatter={(v)=>yen(v)+"人"}/>
                <Line type="monotone" dataKey="total" stroke="#7f0000" strokeWidth={2.5} dot={{r:3}}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
            <h2 style={{margin:"0 0 4px", fontSize:17}}>国籍構成（全国 2025年6月末）</h2>
            <div style={{fontSize:12, color:"#999", marginBottom:4}}>実数（出入国在留管理庁）</div>
            <div style={{display:"flex", flexDirection: narrow?"column":"row", alignItems:"center", gap:10}}>
              <div style={{width: narrow?"100%":"50%", height:170}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={DATA.nationality} dataKey="v" nameKey="name" cx="50%" cy="50%"
                      outerRadius={narrow?70:74} labelLine={false} rootTabIndex={-1}>
                      {DATA.nationality.map((e,i)=><Cell key={i} fill={NAT_COLORS[i%NAT_COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v)=>yen(v)+"人"}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* 凡例（ラベルはみ出し対策で別表示） */}
              <div style={{flex:1, minWidth:0, display:"grid",
                gridTemplateColumns: narrow?"1fr 1fr":"1fr", gap:"2px 12px", fontSize:11}}>
                {(()=>{ const tot=DATA.nationality.reduce((s,x)=>s+x.v,0);
                  return DATA.nationality.map((e,i)=>(
                    <div key={i} style={{display:"flex", alignItems:"center", gap:6}}>
                      <span style={{width:10, height:10, borderRadius:2, flex:"0 0 auto",
                        background:NAT_COLORS[i%NAT_COLORS.length]}}/>
                      <span style={{flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{e.name}</span>
                      <span style={{color:"#888"}}>{(e.v/tot*100).toFixed(0)}%</span>
                    </div>
                  )); })()}
              </div>
            </div>
          </div>
        </div>

        {/* naturalization */}
        <div style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)", marginTop:18}}>
          <h2 style={{margin:"0 0 4px", fontSize:17}}>帰化許可者数の推移</h2>
          <div style={{fontSize:12, color:"#999", marginBottom:4}}>暦年・全国（法務省）※都道府県別データは非公表のため全国のみ</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={DATA.naturalization} margin={{top:6,right:8,left:0,bottom:0}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee"/>
              <XAxis dataKey="year" tick={{fontSize:12}}/>
              <YAxis tick={{fontSize:12}} width={48}/>
              <Tooltip formatter={(v)=>yen(v)+"人"}/>
              <Bar dataKey="n" fill="#2980b9" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{fontSize:10, color:"#999", marginTop:16, lineHeight:1.7}}>
          <b>出典</b>　在留外国人数：出入国在留管理庁「在留外国人統計」（2023年12月末・2024年6月末・2024年12月末・2025年6月末）。
          総人口：総務省統計局「人口推計」2024年10月1日現在。帰化：法務省「帰化許可申請者数等の推移」。<br/>
          <b>注</b>　比率＝在留外国人数(2025.6) ÷ 総人口(2024.10) × 100。分子と分母で時点が異なるため概算。
          帰化者数2023〜24は暫定値。市区町村別・国籍内訳は今後追加予定。<br/>
          <b>地図</b>　Geolonia「japanese-prefectures」（GFDL, Wikipedia の白地図ベース）。
        </div>
      </div>

      {showMuni && <MunicipalityView pref={sel} onClose={()=>setShowMuni(false)} />}
    </div>
  );
}

function SummaryStat({label, name, value, accent, onClick}){
  return (
    <div onClick={onClick} title={onClick?`${name} を選択`:undefined}
      style={{background:"#f4f1ea", borderRadius:8, padding:"8px 10px", textAlign:"center",
        cursor:onClick?"pointer":"default", minWidth:0}}>
      <div style={{fontSize:11, color:"#888"}}>{label}</div>
      {name && <div style={{fontSize:13, fontWeight:700, marginTop:3, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis"}}>{name}</div>}
      <div style={{fontSize:name?15:17, fontWeight:700, color:accent?"#7f0000":"#1a1a1a", marginTop:name?1:5}}>{value}</div>
    </div>
  );
}

function Stat({label,value,accent,small}){
  return (
    <div style={{flex:small?"1 1 45%":1, background:accent?"#7f0000":"#f4f1ea",
      color:accent?"#fff":"#333", borderRadius:8, padding:"7px 6px", textAlign:"center", minWidth:70}}>
      <div style={{fontSize:11, opacity:.8}}>{label}</div>
      <div style={{fontSize:small?15:17, fontWeight:700, marginTop:2}}>{value}</div>
    </div>
  );
}

function RankCard({title,rows,value,frac,color,onSel,sel}){
  return (
    <div style={{background:"#fff", borderRadius:10, padding:16, boxShadow:"0 1px 3px rgba(0,0,0,.08)"}}>
      <h2 style={{margin:"0 0 10px", fontSize:16}}>{title}</h2>
      {rows.map((p,i)=>(
        <div key={p.code} onClick={()=>onSel(p)}
          style={{display:"flex", alignItems:"center", gap:8, padding:"3px 0", cursor:"pointer",
            background:sel.code===p.code?"#faf3f3":"transparent", borderRadius:4}}>
          <span style={{width:20, fontSize:13, color:"#999", textAlign:"right"}}>{i+1}</span>
          <span style={{width:52, fontSize:14, fontWeight:600}}>{p.name}</span>
          <div style={{flex:1, background:"#f0ece2", borderRadius:4, height:14}}>
            <div style={{width:`${Math.max(frac(p)*100,2)}%`, background:color(p), height:"100%", borderRadius:4}}/>
          </div>
          <span style={{width:54, fontSize:13, textAlign:"right"}}>{value(p)}</span>
        </div>
      ))}
    </div>
  );
}
