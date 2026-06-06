import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 最小構成: React + recharts を Vite で起動する
export default defineConfig({
  plugins: [react()],
});
