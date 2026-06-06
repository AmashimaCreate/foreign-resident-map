#!/usr/bin/env python3
"""
外国人比率マップ用データ生成スクリプト（都道府県レベル・自動更新）

e-Stat API（getStatsData）から
  - 在留外国人統計（都道府県別）
  - 人口推計（都道府県 総人口）
を取得し、都道府県別の「外国人数(最新時点)・総人口(最新時点)・比率」を
data/foreign_residents.json に出力する。

使い方:
    export ESTAT_APP_ID=<あなたのアプリケーションID>   # コード直書き禁止。Secrets/環境変数で渡す
    python build_data.py
    python build_data.py --selftest      # API不要のオフライン自己テスト

スコープ（重要）:
    今回は都道府県レベルのみ。市区町村はAPI対象外（件数が膨大／DB表整備状況が不明）。

statsDataId について（必読）:
    ZAIRYU_STATS_ID / POP_STATS_ID の既定値は「画面表示ID(statdisp_id)」。
    各統計表ページの「API」ボタンで実際の statsDataId を確認し、異なる場合は
    環境変数（=ワークフロー入力）で上書きすること。APIがエラー(STATUS!=0)なら
    その旨を表示して終了する。

ハマりどころ対応:
    - @area は5桁。都道府県は末尾000（東京=13000）。全国(00000)・政令市計等・不詳は除外。
    - 在留資格/年齢/性別/国籍などは「総数」に絞らないと二重計上 → メタから総数行を自動判定。
    - @time が複数時点入る表 → 最新時点だけ抽出。
    - 1レスポンス最大10万件 → RESULT_INF.NEXT_KEY を startPosition で辿りページング。
"""

import os
import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path

BASE = os.environ.get("ESTAT_BASE", "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData")
APP_ID = os.environ.get("ESTAT_APP_ID")

# 既定は statdisp_id（実 statsDataId が異なる場合は環境変数で上書き）
ZAIRYU_STATS_ID = os.environ.get("ZAIRYU_STATS_ID") or "0003147229"
POP_STATS_ID = os.environ.get("POP_STATS_ID") or "0004010044"

# 総数コードの手動上書き（ヒューリスティックが外した時用）: JSON {"classId":"code"}
ZAIRYU_TOTALS = os.environ.get("ZAIRYU_TOTALS")
POP_TOTALS = os.environ.get("POP_TOTALS")

PREF_NAMES = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県",
    "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県",
    "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府",
    "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県",
    "宮崎県", "鹿児島県", "沖縄県"]

# 「総数」相当の名称（優先順）。exact一致を優先し、誤って小計（例: アジア計）を拾わない。
TOTAL_PRIORITY = ["総数", "総人口", "男女計", "男女総数", "総数（男女計）", "計", "合計", "全国籍", "全域"]


def as_list(x):
    """e-Stat JSON は要素1件だと list でなく dict になる。常に list 化する。"""
    if x is None:
        return []
    return x if isinstance(x, list) else [x]


def norm(s):
    return (s or "").replace(" ", "").replace("　", "")


def to_int(s):
    try:
        return int(str(s).replace(",", ""))
    except (ValueError, TypeError):
        return None


def pref_code_from_area(area):
    """@area(5桁) → 都道府県2桁コード。都道府県以外（全国/政令市計/不詳等）は None。"""
    a = str(area).zfill(5)
    if not a.endswith("000"):       # 政令市計(00409)・市区町村(13101)・不詳(13999)等を除外
        return None
    pref = a[:2]
    if pref == "00":                # 全国(00000)を除外
        return None
    if not ("01" <= pref <= "47"):  # 都道府県コード範囲外を除外
        return None
    return pref


def http_get_json(params, retries=3):
    url = BASE + "?" + urllib.parse.urlencode(params)  # urlencode は UTF-8
    last = None
    for i in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "foreign-resident-map/1.0"})
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.load(r)
        except urllib.error.URLError as e:
            last = e
            time.sleep(1.5 * (i + 1))
    raise SystemExit(f"ERROR: e-Stat API 接続失敗: {last}")


# fetch_all がHTTP取得に使う関数（自己テストで差し替え可能にするための間接参照）
_fetcher = http_get_json


def fetch_all(stats_id):
    """getStatsData をページングして (class_objs, values) を返す。"""
    if not APP_ID:
        sys.exit("ERROR: 環境変数 ESTAT_APP_ID が未設定です（GitHub Secrets に ESTAT_APP_ID を登録してください）。")
    values, class_objs, start, page = [], None, None, 0
    while True:
        params = {
            "appId": APP_ID, "statsDataId": stats_id, "lang": "J",
            "metaGetFlg": "Y" if class_objs is None else "N", "cntGetFlg": "N",
        }
        if start:
            params["startPosition"] = start
        data = _fetcher(params)
        root = data.get("GET_STATS_DATA", {})
        status = root.get("RESULT", {}).get("STATUS")
        if status != 0:
            msg = root.get("RESULT", {}).get("ERROR_MSG", "")
            sys.exit(f"ERROR: e-Stat API status={status} {msg} (statsDataId={stats_id})")
        sd = root["STATISTICAL_DATA"]
        if class_objs is None:
            class_objs = as_list(sd["CLASS_INF"]["CLASS_OBJ"])
        values.extend(as_list(sd.get("DATA_INF", {}).get("VALUE", [])))
        page += 1
        next_key = sd.get("RESULT_INF", {}).get("NEXT_KEY")
        if not next_key:
            break
        start = next_key
    print(f"  fetched statsDataId={stats_id}: {len(values)} 値 / {page} ページ")
    return class_objs, values


def pick_total_codes(class_objs, overrides=None):
    """area/time 以外の各分類について「総数」相当コードを決める（=二重計上の防止）。"""
    overrides = overrides or {}
    totals = {}
    for cls in class_objs:
        cid = cls.get("@id")
        if cid in ("area", "time"):
            continue
        members = as_list(cls.get("CLASS"))
        names = [(m.get("@code"), norm(m.get("@name"))) for m in members]
        if cid in overrides:
            totals[cid] = overrides[cid]
            print(f"  total[{cid}] = {overrides[cid]} (override)")
            continue
        pick = None
        for kw in TOTAL_PRIORITY:                      # exact一致を優先
            for code, name in names:
                if name == kw:
                    pick = code
                    break
            if pick:
                break
        if pick is None:                               # 部分一致（…総数）
            for code, name in names:
                if "総数" in name:
                    pick = code
                    break
        if pick is None and len(members) == 1:         # 単一メンバーならそれが総数
            pick = members[0].get("@code")
        if pick is None:
            opts = ", ".join(f"{c}:{n}" for c, n in names)
            sys.exit(f"ERROR: 分類 {cid}（{cls.get('@name')}）の総数コードを特定できません。"
                     f" 候補=[{opts}] → 環境変数 *_TOTALS で上書きしてください。")
        picked = next((n for c, n in names if c == pick), "")
        print(f"  total[{cid}] = {pick} ({picked})")
        totals[cid] = pick
    return totals


def area_name_map(class_objs):
    for cls in class_objs:
        if cls.get("@id") == "area":
            return {m.get("@code"): m.get("@name") for m in as_list(cls.get("CLASS"))}
    return {}


def extract_latest_pref(class_objs, values, overrides=None):
    """都道府県 × 総数 × 最新時点 の値を {pref2桁: int} で返す。"""
    totals = pick_total_codes(class_objs, overrides)
    rows = []
    for v in values:
        if any(v.get("@" + cid) != tc for cid, tc in totals.items()):
            continue                                   # 総数以外（明細）は捨てる
        pref = pref_code_from_area(v.get("@area", ""))
        if pref is None:
            continue                                   # 全国・政令市計・不詳・市区町村を除外
        val = to_int(v.get("$"))
        if val is None:
            continue                                   # "-" や秘匿記号などは無視
        rows.append((pref, v.get("@time", ""), val))
    if not rows:
        sys.exit("ERROR: 都道府県×総数×最新時点の値が0件。statsDataId / 総数フィルタを確認してください。")
    latest = max(t for _, t, _ in rows)                # 最新時点のみ
    out = {}
    for pref, t, val in rows:
        if t == latest:
            out[pref] = out.get(pref, 0) + val          # 念のため合算（通常は1件）
    return out, latest


def parse_overrides(env):
    if not env:
        return {}
    try:
        return json.loads(env)
    except json.JSONDecodeError:
        sys.exit("ERROR: *_TOTALS の上書きJSONが不正です。")


def build():
    print("== 在留外国人（都道府県別） ==")
    zclass, zval = fetch_all(ZAIRYU_STATS_ID)
    foreign, ftime = extract_latest_pref(zclass, zval, parse_overrides(ZAIRYU_TOTALS))
    print(f"  → {len(foreign)} 都道府県 / 最新時点 {ftime}")

    print("== 総人口（都道府県別） ==")
    pclass, pval = fetch_all(POP_STATS_ID)
    pop, ptime = extract_latest_pref(pclass, pval, parse_overrides(POP_TOTALS))
    print(f"  → {len(pop)} 都道府県 / 最新時点 {ptime}")

    names = {}
    for code5, name in {**area_name_map(zclass), **area_name_map(pclass)}.items():
        pc = pref_code_from_area(code5)
        if pc:
            names[pc] = name

    prefs, missing = [], []
    for i in range(1, 48):
        code = f"{i:02d}"
        f, p = foreign.get(code), pop.get(code)
        ratio = round(f / p * 100, 3) if (f and p) else None
        if f is None or p is None:
            missing.append(code)
        prefs.append({"code": code, "name": names.get(code, PREF_NAMES[i - 1]),
                      "foreign": f, "pop": p, "ratio": ratio})

    out = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "scope": "prefecture",
        "source": {
            "foreign": {"provider": "出入国在留管理庁 在留外国人統計（e-Stat API）",
                        "statsDataId": ZAIRYU_STATS_ID, "time": ftime},
            "population": {"provider": "総務省 人口推計（e-Stat API）",
                           "statsDataId": POP_STATS_ID, "time": ptime},
        },
        "note": "比率＝在留外国人数(最新時点) ÷ 総人口(最新時点) × 100。両者の時点が数か月ずれるため概算。"
                "都道府県レベルのみ（市区町村はAPI対象外）。",
        "prefs": prefs,
    }
    out_dir = Path("data")
    out_dir.mkdir(exist_ok=True)
    out_path = out_dir / "foreign_residents.json"
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")

    valid = sum(1 for p in prefs if p["ratio"] is not None)
    print(f"OK: wrote {out_path}  （比率算出 {valid}/47 都道府県, foreign時点={ftime}, pop時点={ptime}）")
    if missing:
        print(f"WARN: 欠損 {len(missing)} 件: {missing}")
    for p in sorted((p for p in prefs if p["ratio"] is not None), key=lambda x: -x["ratio"])[:3]:
        print(f"  例 {p['name']}: 外国人{p['foreign']:,} / 人口{p['pop']:,} / {p['ratio']}%")


# --------------------------------------------------------------------------
# オフライン自己テスト（API不要）: ハマりどころを実データ模擬で検証
# --------------------------------------------------------------------------
def _selftest():
    global _fetcher, APP_ID

    # 在留外国人（疑似）: 全国/政令市計/不詳除外, 中国(明細)除外, 旧時点除外 を確認
    zclass = [
        {"@id": "tab", "@name": "表章項目", "CLASS": {"@code": "001", "@name": "人口", "@unit": "人"}},
        {"@id": "cat01", "@name": "国籍・地域", "CLASS": [
            {"@code": "000", "@name": "総数"}, {"@code": "100", "@name": "中国"}]},
        {"@id": "area", "@name": "地域", "CLASS": [
            {"@code": "00000", "@name": "全国"}, {"@code": "01000", "@name": "北海道"},
            {"@code": "13000", "@name": "東京都"}, {"@code": "00409", "@name": "政令市計"},
            {"@code": "13999", "@name": "不詳"}]},
        {"@id": "time", "@name": "時間軸", "CLASS": [
            {"@code": "2024", "@name": "2024年"}, {"@code": "2025", "@name": "2025年"}]},
    ]
    zval = [
        {"@tab": "001", "@cat01": "000", "@area": "00000", "@time": "2025", "$": "3956619"},  # 全国→除外
        {"@tab": "001", "@cat01": "000", "@area": "01000", "@time": "2025", "$": "69620"},    # 北海道 最新
        {"@tab": "001", "@cat01": "000", "@area": "01000", "@time": "2024", "$": "56485"},    # 旧時点→除外
        {"@tab": "001", "@cat01": "100", "@area": "01000", "@time": "2025", "$": "20000"},    # 中国明細→除外
        {"@tab": "001", "@cat01": "000", "@area": "13000", "@time": "2025", "$": "775340"},   # 東京 最新
        {"@tab": "001", "@cat01": "000", "@area": "00409", "@time": "2025", "$": "123"},       # 政令市計→除外
        {"@tab": "001", "@cat01": "000", "@area": "13999", "@time": "2025", "$": "45"},        # 不詳→除外
    ]
    foreign, ftime = extract_latest_pref(zclass, zval)
    assert foreign == {"01": 69620, "13": 775340}, foreign
    assert ftime == "2025", ftime

    # 人口推計（疑似）: tab=総人口 を選び日本人人口を除外, 最新年のみ
    pclass = [
        {"@id": "tab", "@name": "表章項目", "CLASS": [
            {"@code": "00710", "@name": "総人口"}, {"@code": "00720", "@name": "日本人人口"}]},
        {"@id": "area", "@name": "地域", "CLASS": [
            {"@code": "00000", "@name": "全国"}, {"@code": "01000", "@name": "北海道"},
            {"@code": "13000", "@name": "東京都"}]},
        {"@id": "time", "@name": "時間軸", "CLASS": [
            {"@code": "2023100000", "@name": "2023年10月"}, {"@code": "2024100000", "@name": "2024年10月"}]},
    ]
    pval = [
        {"@tab": "00710", "@area": "01000", "@time": "2024100000", "$": "5043000"},
        {"@tab": "00710", "@area": "01000", "@time": "2023100000", "$": "5092000"},  # 旧年→除外
        {"@tab": "00720", "@area": "01000", "@time": "2024100000", "$": "4900000"},  # 日本人→除外
        {"@tab": "00710", "@area": "13000", "@time": "2024100000", "$": "14178000"},
        {"@tab": "00710", "@area": "00000", "@time": "2024100000", "$": "123000000"},  # 全国→除外
    ]
    pop, ptime = extract_latest_pref(pclass, pval)
    assert pop == {"01": 5043000, "13": 14178000}, pop
    assert ptime == "2024100000", ptime

    # 比率
    assert round(69620 / 5043000 * 100, 3) == 1.381

    # area判定の境界
    assert pref_code_from_area("13000") == "13"
    assert pref_code_from_area("00000") is None
    assert pref_code_from_area("00409") is None
    assert pref_code_from_area("13101") is None   # 市区町村
    assert pref_code_from_area("47000") == "47"

    # ページング（NEXT_KEY→startPosition）の蓄積を擬似HTTPで検証
    pages = [
        {"GET_STATS_DATA": {"RESULT": {"STATUS": 0}, "STATISTICAL_DATA": {
            "CLASS_INF": {"CLASS_OBJ": zclass}, "DATA_INF": {"VALUE": [zval[1]]},
            "RESULT_INF": {"NEXT_KEY": "101"}}}},
        {"GET_STATS_DATA": {"RESULT": {"STATUS": 0}, "STATISTICAL_DATA": {
            "CLASS_INF": {"CLASS_OBJ": zclass}, "DATA_INF": {"VALUE": [zval[4]]},
            "RESULT_INF": {}}}},
    ]
    seq = iter(pages)
    saved_fetcher, saved_id = _fetcher, APP_ID
    _fetcher, APP_ID = (lambda params: next(seq)), "TESTID"
    try:
        cobjs, vals = fetch_all("DUMMY")
    finally:
        _fetcher, APP_ID = saved_fetcher, saved_id
    assert len(vals) == 2, vals
    assert extract_latest_pref(cobjs, vals)[0] == {"01": 69620, "13": 775340}

    print("SELFTEST: PASS ✅  (area除外 / 総数フィルタ / 最新時点 / ページング / 比率)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="e-Stat → data/foreign_residents.json")
    ap.add_argument("--selftest", action="store_true", help="API不要のオフライン自己テスト")
    args = ap.parse_args()
    if args.selftest:
        _selftest()
    else:
        build()
