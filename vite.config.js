import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 最小構成: React + recharts を Vite で起動する。
// base: 独自ドメイン seiji-mieru.com の「ルート」公開のため "/"。
//   （旧: GitHub Pages プロジェクトページの "/foreign-resident-map/"）
//   ※ ルート公開で base を "/" にし忘れると本番でアセットを解決できず真っ白になる。
export default defineConfig({
  base: "/",
  plugins: [react()],
});
