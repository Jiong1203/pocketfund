import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
// The Cloudflare plugin runs the API Worker (packages/backend) inside workerd during dev,
// so no proxy to a separate backend server is needed.
export default defineConfig({
  plugins: [vue(), cloudflare()],
  server: {
    port: 5173
  }
});
