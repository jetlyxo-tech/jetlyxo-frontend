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
        navy: {
          950: "#0b1b2b",
          900: "#0f2435",
          800: "#152d42",
          700: "#1a3650",
          600: "#244362",
          500: "#2d5175",
        },
        jetly: {
          accent: "#4f9cff",
          highlight: "#ff7a18",
          "accent-glow": "rgba(79, 156, 255, 0.4)",
          "highlight-glow": "rgba(255, 122, 24, 0.5)",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "hero-gradient":
          "linear-gradient(180deg, rgba(11,27,43,0.4) 0%, rgba(15,36,53,0.9) 50%, #0b1b2b 100%)",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
        glow: "0 0 40px -10px rgba(79, 156, 255, 0.4)",
        "glow-accent": "0 0 40px -10px rgba(79, 156, 255, 0.4)",
        "glow-orange": "0 0 40px -5px rgba(255, 122, 24, 0.5)",
      },
      animation: {
        "plane-fly": "planeFly 20s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        planeFly: {
          "0%": { transform: "translateX(-100px) translateY(0) rotate(0deg)" },
          "100%": { transform: "translateX(100vw) translateY(-20px) rotate(2deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
