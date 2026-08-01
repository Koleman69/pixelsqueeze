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
          "charts": ["recharts"],
          "query": ["@tanstack/react-query"],
          "motion": ["framer-motion"],
          "supabase": ["@supabase/supabase-js"],
        },
      },
    },
    // Do not ship untranspiled ESNext to production. Safari 14+ keeps BigInt
    // support required by the image engine while avoiding modern syntax blanks.
    target: ["es2020", "safari14"],
    cssTarget: "safari14",
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
