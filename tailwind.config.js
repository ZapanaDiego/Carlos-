/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Catppuccin Mocha
        crust:   '#11111b',
        mantle:  '#181825',
        base:    '#1e1e2e',
        surface0:'#313244',
        surface1:'#45475a',
        surface2:'#585b70',
        overlay0:'#6c7086',
        overlay1:'#7f849c',
        subtext: '#a6adc8',
        text:    '#cdd6f4',
        lavender:'#b4befe',
        blue:    '#89b4fa',
        sapphire:'#74c7ec',
        sky:     '#89dceb',
        teal:    '#94e2d5',
        green:   '#a6e3a1',
        yellow:  '#f9e2af',
        peach:   '#fab387',
        maroon:  '#eba0ac',
        red:     '#f38ba8',
        mauve:   '#cba6f7',
        pink:    '#f5c2e7',
        flamingo:'#f2cdcd',
        rosewater:'#f5e0dc',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 4px rgba(137,180,250,0.3)' },
          '100%': { boxShadow: '0 0 16px rgba(137,180,250,0.8)' },
        }
      }
    },
  },
  plugins: [],
}
