import type { Config } from 'tailwindcss';

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E69A18',
          dark: '#BF7300',
          black: '#101010',
          soft: '#F8F4ED'
        }
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.12)'
      }
    }
  },
  plugins: []
} satisfies Config;
