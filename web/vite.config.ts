import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Natija: dist/index.html + dist/assets/*. scripts/inline.mjs ularni bitta faylga birlashtiradi.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false, chunkSizeWarningLimit: 4000 },
});
