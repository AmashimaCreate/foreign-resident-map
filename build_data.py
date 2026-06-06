#!/usr/bin/env python3
"""
外国人比率マップ用データ生成スクリプト
e-Stat API（getStatsData）から在留外国人統計・人口推計を取得し、
都道府県別の人数・比率・推移を算出して data/foreign_residents.json を出力する。

使い方:
    export ESTAT_APP_ID=あなたのアプリケーションID
    python build_data.py

GitHub Actions から定期実行することを想定（末尾のworkflow例参照）。
"""

import os
import json
import sys
import time
import urllib.request
import urllib.parse
from pathlib import Path

APP_ID = os.environ.get("ESTAT_APP_ID")
BASE = "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData"

# ---- 取得対象の統計表ID ----------------------------------------------------
# ※ statsDataId は e-Stat の各統計表ページ「API」ボタンで確認できる正確な値に
#    差し替えること。下記はプレースホルダなので、実IDを設定する。
#    在留外国人統計：統計表「t1（都道府県別・国籍別）」相当のDB版IDを使う。
#    人口推計：都道府県別 総人口（各年10月1日現在）のDB版IDを使う。
TARGETS = {
    "zairyu": {
        "statsDataId": "REPLACE_WITH_ZAIRYU_TABLE_ID",   # 在留外国人統計 都道府県別
        # 必要に応じ cdCat 等で在留資格=総数などに絞る
    },
    "population": {
        "statsDataId": "REPLACE_WITH_POPULATION_TABLE_ID",  # 人口推計 都道府県別総人口
    },
}

PREF_NAMES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県",
    "栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県",
    "福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府",
    "大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県",
    "徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県",
    "宮崎県","鹿児島県","沖縄県"]


def fetch(stats_data_id, extra=None):
    """getStatsData を叩いて JSON を返す。"""
    if not APP_ID:
        sys.exit("ERROR: 環境変数 ESTAT_APP_ID が未設定です。")
    params = {
        "appId": APP_ID,
        "statsDataId": stats_data_id,
        "lang": "J",
        "metaGetFlg": "Y",
        "cntGetFlg": "N",
    }
    if extra:
        params.update(extra)
    url = BASE + "?" + urllib.parse.urlencode(params)
    with urllib.request.urlopen(url, timeout=60) as r:
        data = json.load(r)
    status = data["GET_STATS_DATA"]["RESULT"]["STATUS"]
    if status != 0:
        msg = data["GET_STATS_DATA"]["RESULT"].get("ERROR_MSG", "")
        sys.exit(f"ERROR: e-Stat API status={status} {msg}")
    return data


def parse_values(data):
    """VALUE 配列を取り出す。各要素は {'@cat01':..,'@area':..,'$':'1234'} の形。"""
    return data["GET_STATS_DATA"]["STATISTICAL_DATA"]["DATA_INF"]["VALUE"]


def build():
    out_dir = Path("data")
    out_dir.mkdir(exist_ok=True)

    # --- 在留外国人（都道府県別） ---
    zairyu_raw = fetch(TARGETS["zairyu"]["statsDataId"])
    # area コード→人数 のマップを作る（実装は実データのメタ構造に合わせて調整）
    # ここでは @area が都道府県コード、$ が人数である前提のサンプル集計
    zairyu_by_pref = {}
    for v in parse_values(zairyu_raw):
        area = v.get("@area", "")
        try:
            n = int(v["$"])
        except (ValueError, KeyError):
            continue
        zairyu_by_pref[area] = zairyu_by_pref.get(area, 0) + n

    # --- 総人口（都道府県別） ---
    pop_raw = fetch(TARGETS["population"]["statsDataId"])
    pop_by_pref = {}
    for v in parse_values(pop_raw):
        area = v.get("@area", "")
        try:
            pop_by_pref[area] = int(v["$"])
        except (ValueError, KeyError):
            continue

    # --- 統合して比率算出 ---
    prefs = []
    for i, name in enumerate(PREF_NAMES, start=1):
        code = f"{i:02d}"
        # area コードのマッチングは実メタに合わせる（5桁=code+"000" など）
        foreign = zairyu_by_pref.get(code) or zairyu_by_pref.get(code + "000")
        pop = pop_by_pref.get(code) or pop_by_pref.get(code + "000")
        ratio = round(foreign / pop * 100, 3) if (foreign and pop) else None
        prefs.append({"code": code, "name": name,
                      "foreign": foreign, "pop": pop, "ratio": ratio})

    result = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S+09:00"),
        "source": {
            "foreign": "出入国在留管理庁 在留外国人統計（e-Stat API）",
            "population": "総務省 人口推計（e-Stat API）",
        },
        "prefs": prefs,
    }
    out_path = out_dir / "foreign_residents.json"
    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK: wrote {out_path} ({len(prefs)} prefectures)")


if __name__ == "__main__":
    build()
