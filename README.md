# 外国人比率マップ

都道府県別の在留外国人の比率・人数・増減を表示する React 製マップ。
データは現在 `foreign-resident-map.jsx` に直書き（実データ・2025年6月末時点）。

**公開URL（GitHub Pages）**: https://amashimacreate.github.io/foreign-resident-map/

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
