/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D4ED8",     // Primary Blue
        darkNavy: "#0F2044",    // Headings, heavy text
        tealAccent: "#0D9488",  // Agent progress, success states
        bgPage: "#F8FAFC",      // Page background
        cardSurface: "#FFFFFF"  // Card background
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        input: "8px",
        pill: "99px"
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08)",
      }
    },
  },
  plugins: [],
}
