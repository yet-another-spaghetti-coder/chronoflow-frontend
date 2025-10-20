import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function writeFirebaseConfig(env: Record<string, string>) {
  const cfg = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
  };
  const out = `self.FIREBASE_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;
  const outPath = path.resolve(__dirname, "public/firebase-config.js");
  fs.writeFileSync(outPath, out);
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // Generate firebase-config.js for both dev & build
  const generateFirebaseConfigPlugin = {
    name: "generate-firebase-config",
    // dev: run when server starts
    configureServer() {
      writeFirebaseConfig(env);
    },
    // build: run after bundle is generated
    closeBundle() {
      writeFirebaseConfig(env);
    },
  };

  return {
    base: "/",
    plugins: [react(), tailwindcss(), generateFirebaseConfigPlugin],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: ["zustand"],
    },

    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
      css: true,
    },
  };
});
