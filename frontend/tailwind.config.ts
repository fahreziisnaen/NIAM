import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        navy: {
          950: "#07101E",
          900: "#0A192F", // Target sidebar navy
          850: "#0F2342",
          800: "#142B50",
          700: "#1E3A8A",
        },
        corporate: {
          blue: "#1E60D5",
          lightBlue: "#2563EB",
          cardBg: "#FFFFFF",
          mainBg: "#F4F6F9",
          border: "#E2E8F0",
          textMuted: "#64748B",
          textMain: "#0F172A",
        }
      },
    },
  },
  plugins: [],
};
export default config;
