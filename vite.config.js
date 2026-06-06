import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 最小構成: React + recharts を Vite で起動する。
// base: GitHub Pages（プロジェクトページ）は /<repo>/ 配下に公開されるため、
//   本番ビルド時のみ "/foreign-resident-map/" を基準にする。
//   ローカル開発 (npm run dev) は "/" のままなので http://localhost:5173 で開ける。
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/foreign-resident-map/" : "/",
  plugins: [react()],
}));
