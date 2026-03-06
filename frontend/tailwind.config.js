/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  safelist: [
    // Slate (used in game options)
    "bg-slate-500", "bg-slate-500/5", "bg-slate-500/10",
    "border-slate-500/20", "border-slate-500/30", "text-slate-400",
    "bg-slate-600", "bg-slate-700/50", "bg-slate-800/30",
    "border-slate-700/50",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['LuckiestGuy_400Regular'],
        accent: ['Bungee_400Regular'],
        body: ['Nunito_400Regular'],
        'body-semibold': ['Nunito_600SemiBold'],
        'body-bold': ['Nunito_700Bold'],
        'body-extrabold': ['Nunito_800ExtraBold'],
      },
      colors: {
        'team-red': '#ff6b6b',
        'team-blue': '#4ecdc4',
        'game-bg': '#0D0B14',
        'card-bg': '#1A1520',
        'game-purple': '#9B59B6',
        'game-indigo': '#6C5CE7',
        'game-pink': '#E85D75',
        'game-success': '#10B981',
        'game-warning': '#F59E0B',
        'fn-pink': '#E85D75',
        'fn-purple': '#9B59B6',
        'fn-yellow': '#FFD93D',
        'fn-yellow-dark': '#CA8A04',
        'fn-dark': '#0D0B14',
        'fn-card': '#1A1520',
        'fn-mid': '#231C2B',
      },
      fontSize: {
        '7xl': ['72px', { lineHeight: '1' }],
        '8xl': ['96px', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
};
