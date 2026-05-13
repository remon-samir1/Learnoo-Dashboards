/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#2137D6",
        "primary-blue": "#2563EB",
        "text-main": "#33332F",
        "text-dark": "#111827",
        "text-muted": "#4B5563",
        "text-placeholder": "#BBBBBA",
        "border-color": "#EEEEEE",
      },
      backgroundImage: {
        'auth-bg': 'linear-gradient(135deg, #EFF6FF 25%, #FFFFFF 60.36%, #F9FAFB 95.71%)',
      
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}

