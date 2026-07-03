import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                navy: "#0A0F1E",
                midnight: "#0D1B3E",
                teal: {
                    DEFAULT: "#00D4AA",
                    muted: "#00B894",
                },
                emergency: "#FF4757",
                caution: "#FFA502",
                success: "#2ED573",
                neutralgray: "#8892A4",
                surface: {
                    0: "#0A0F1E",
                    1: "#0D1B3E",
                    2: "#111D42",
                    3: "#172050",
                },
                text: {
                    primary: "#F0F4FF",
                    secondary: "#8892A4",
                    muted: "#4A5568",
                },
            },
            borderColor: {
                DEFAULT: "rgba(255,255,255,0.08)",
                strong: "rgba(255,255,255,0.16)",
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
