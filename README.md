# 外国人比率マップ

都道府県別の在留外国人の比率・人数・増減を表示する React 製マップ。
都道府県データは `foreign-resident-map.jsx` に直書き（実データ・2025年6月末時点）。
県をタップすると市区町村ドリルダウン（ミニ地図＋ランキング、市単位⇔区単位切替）を表示。

**公開URL（GitHub Pages）**: https://amashimacreate.github.io/foreign-resident-map/

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
├── build_data.py           … e-Stat API データ生成（今は未使用）
└── .github/workflows/
    └── update-foreign-residents.yml … 月次データ更新ワークフロー（今は未使用）
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
- 公開URL: https://amashimacreate.github.io/foreign-resident-map/
- 本番ビルドの `base` は `vite.config.js` で `/foreign-resident-map/` に設定
