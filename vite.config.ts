import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-radix": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-accordion",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
          ],
          "icons": ["lucide-react"],
          "charts": ["recharts"],
          "query": ["@tanstack/react-query"],
          "motion": ["framer-motion"],
          "supabase": ["@supabase/supabase-js"],
        },
      },
    },
    target: "esnext",
    minify: "esbuild",
    sourcemap: false,
    cssMinify: true,
    chunkSizeWarningLimit: 800,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
