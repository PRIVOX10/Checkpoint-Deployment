import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    // Put the production build directly in the backend's "public" folder,
    // so Express can serve the React app (see server.js)
    outDir: "../public",
    emptyOutDir: true,
  },

  server: {
    // In development (npm run dev), forward API calls to the Express server
    proxy: {
      "/users": "http://localhost:5000",
    },
  },
});
