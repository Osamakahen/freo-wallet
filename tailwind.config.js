/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1890ff',
        secondary: '#52c41a',
        error: '#f5222d',
        warning: '#faad14',
        success: '#52c41a',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
} 