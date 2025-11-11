import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    cors: true,
    fs: {
      allow: ["./src/assets", "./src", "./node_modules"], // Allow access to src/assets, src, and node_modules for serving
    },
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
  build: {
    assetsDir: "assets", // Output assets to dist/assets
    rollupOptions: {
      external: [
        '@codetrix-studio/capacitor-google-auth'
      ],
      output: {
        assetFileNames: "assets/[name].[ext]", // Ensure assets like leaflet.css and images are in dist/assets
      },
    },
  },
  define: {
    global: 'globalThis',
  },
}));