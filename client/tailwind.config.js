/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1a1a1a',
                secondary: '#6b7280',
                accent: '#3b82f6',
                border: '#e5e7eb',
                background: '#f9fafb',
                sidebar: '#f3f4f6',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
