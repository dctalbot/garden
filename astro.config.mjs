import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  output: "static",
  compressHTML: true, // keep pre-v7 whitespace rules
  vite: {
    plugins: [tailwindcss()],
  },
});
