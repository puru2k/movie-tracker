import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  // For GitHub Pages the app is served from a sub-path (e.g. /movie-tracker/).
  // Other hosts (Vercel/Netlify) and local dev serve from root, so default to "/".
  // @ts-expect-error process is a nodejs global
  base: process.env.BASE_PATH || "/",

  plugins: [react(), tailwindcss()],

  server: {
    port: 5173,
  },
});
