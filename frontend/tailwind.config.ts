import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        coast: {
          50: "#f4fbf9",
          100: "#dff4ef",
          500: "#2f9c8f",
          700: "#1d6f68"
        },
        coral: {
          100: "#ffe8dc",
          500: "#f47c56",
          700: "#b94d30"
        },
        ink: "#17211f"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(23, 33, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
