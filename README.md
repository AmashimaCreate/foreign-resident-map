# 外国人比率マップ

都道府県別の在留外国人の比率・人数・増減を表示する React 製マップ。
都道府県データは `foreign-resident-map.jsx` に直書き（実データ・2025年6月末時点）。
県をタップすると市区町村ドリルダウン（ミニ地図＋ランキング、市単位⇔区単位切替）を表示。

**公開URL**: https://seiji-mieru.com （独自ドメイン・GitHub Pages ホスティング）

## 主な機能

- 都道府県マップ（比率%／人数／増減率の3指標・赤系グラデーション）
- 推移グラフ・国籍構成・帰化推移・ランキング
- **市区町村ドリルダウン**（`municipalities.json`・外国人2025.6／人口2025.1住基）
  - `MunicipalityView.jsx`。168KB のため初回表示時に動的import（別チャンク）
  - 政令市・特別区は「市単位⇔区単位」で区の内訳を展開

## 起動

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## フォルダ構成

```
外国人map/
├── index.html              … HTML テンプレート（#root にマウント）
├── src/main.jsx            … エントリポイント（App を描画）
├── foreign-resident-map.jsx … メインコンポーネント（データ直書き・recharts 使用）
├── vite.config.js          … Vite 設定（React プラグインのみ）
├── package.json
├── build_data.py           … e-Stat API で都道府県別 総人口を取得 → data/population.json
└── .github/workflows/
    ├── deploy-pages.yml             … main push で Pages へ自動デプロイ
    └── update-foreign-residents.yml … 月次で総人口を自動更新（手動実行も可）
```

## ビルド

```bash
npm run build      # dist/ に静的出力
npm run preview    # ビルド結果をローカル確認
```

## デプロイ（GitHub Pages）

`main` への push で `.github/workflows/deploy-pages.yml` が走り、
ビルド → `actions/deploy-pages` で自動公開します（手動操作は不要）。

- Pages のソースは「GitHub Actions」（初回のみ API で有効化済み）
- 公開URL: https://seiji-mieru.com （独自ドメイン。Cloudflare DNS→GitHub Pages、プロキシOFF）
- `vite.config.js` の `base` は `/`（ルート公開）。`public/CNAME` に `seiji-mieru.com` を置きビルドで `dist/CNAME` へ出力

## データ更新（出典と運用方針）

| データ | 出典 | 更新方法 |
|---|---|---|
| **総人口（都道府県）** | 総務省 人口推計（e-Stat API） | **自動**（`build_data.py` → `data/population.json`、月次ワークフロー） |
| 在留外国人（都道府県） | 出入国在留管理庁 在留外国人統計 | **手動**（Excel から取得し `foreign-resident-map.jsx` を更新） |
| 在留外国人・人口（市区町村） | 在留外国人統計 / 住民基本台帳 | **手動**（Excel から取得し `municipalities.json` を更新） |

**なぜ在留外国人は手動か**：e-Stat の API データベース表では、**都道府県別・市区町村別の「在留外国人」は2017年までしか整備されていない**
（現行は全国の国籍別表のみ DB 化）。そのため在留外国人は半年に1回、e-Stat の Excel から手動更新する。
総人口は都道府県別の最新年（現在2024年）が API DB にあるため自動化している。

### 総人口の自動更新

- 事前準備：e-Stat の appId を発行し、リポジトリ Secrets に `ESTAT_APP_ID` で登録（コード直書き禁止）
- 実行：Actions の「Update foreign residents data」を `Run workflow`（月次でも自動実行）
- 使用表：`statsDataId=0003448232`（都道府県，男女別人口－総人口、単位 千人 → 人に換算）
- 正しい statsDataId を探す補助：`Run workflow` の `discover=true`（`getStatsList` で候補と時点・単位を一覧）

> ⚠️ `statdisp_id`（画面表示ID）と API の `statsDataId` は異なることがある。`discover` か各表の「API」ボタンで確認し、
> 必要なら入力 `pop_stats_id` / `zairyu_stats_id` で上書きする。
