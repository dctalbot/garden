/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        "garden-green": "#2F5233",
        leaf: "#4F7942",
        soil: "#5C4033",
      },
    },
  },
};
