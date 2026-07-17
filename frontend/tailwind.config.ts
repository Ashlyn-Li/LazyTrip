import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coast: {
          50: "#fff3f7",
          100: "#ffdce9",
          500: "#ee7fa8",
          700: "#cf4f7f"
        },
        coral: {
          100: "#f1e8ff",
          500: "#8c6ee8",
          700: "#5a45bd"
        },
        ink: "#1e1b2e"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(118, 65, 78, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
