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
        stellar: {
          blue: "#0E1F40",
          purple: "#7B2FBE",
          light: "#E8F4FD",
        },
      },
    },
  },
  plugins: [],
};

export default config;
