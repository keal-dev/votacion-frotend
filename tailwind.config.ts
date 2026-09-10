import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0d1b2a',
        navy2: '#13283d',
        green: {
          DEFAULT: '#159447',
          2: '#0f7d3b',
        },
        blue: '#2563eb',
        orange: '#f59e0b',
        red: '#dc2626',
        text: '#18212b',
        muted: '#6b7280',
        line: '#e5e7eb',
        bg: '#f5f7fa',
        white: '#fff',
      },
    },
  },
  plugins: [],
};

export default config;
