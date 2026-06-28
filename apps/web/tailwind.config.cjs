/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0B1220', soft: '#1A2236', mute: '#5B6478' },
        accent: { DEFAULT: '#FF6A3D', soft: '#FFB199' },
        paper: '#F8F5EE',
      },
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      maxWidth: { prose: '720px' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
