import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
        proxy: {
          '/ximilar': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/debug': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/health': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          },
          '/ai': {
            target: 'http://localhost:8000',
            changeOrigin: true,
          }
        }
  }
});