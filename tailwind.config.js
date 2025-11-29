/** @type {import('tailwindcss').Config} */
import animate from "tailwindcss-animate";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        // 核心修改：增加了 opacity 变化，模拟从暗处浮现
        'tactical-zoom': {
          '0%': { transform: 'scale(0.9)', filter: 'blur(8px)', opacity: '0' },
          '100%': { transform: 'scale(1)', filter: 'blur(0)', opacity: '1' },
        },
        'progress': {
          '0%': { width: '0%', opacity: '1' },
          '100%': { width: '100%', opacity: '0' },
        },
        // 四角动画：加大位移距离，更具冲击力
        'lock-tl': { '0%': { transform: 'translate(-50px, -50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
        'lock-tr': { '0%': { transform: 'translate(50px, -50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
        'lock-bl': { '0%': { transform: 'translate(-50px, 50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
        'lock-br': { '0%': { transform: 'translate(50px, 50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
      },
      animation: {
        'tactical-zoom': 'tactical-zoom 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        'progress': 'progress 1s ease-out forwards',
        'lock-tl': 'lock-tl 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'lock-tr': 'lock-tr 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'lock-bl': 'lock-bl 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'lock-br': 'lock-br 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards',
      }
    },
  },
  plugins: [animate],
}