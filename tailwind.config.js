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
        // 📷 核心修改：增强版战术对焦动画 (呼吸感 + 寻焦)
        // 模拟镜头马达：暗处模糊 -> 快速过冲(变亮) -> 微调回缩 -> 锁定清晰
        'tactical-zoom': {
          '0%': { 
            transform: 'scale(0.92)', 
            filter: 'blur(10px)', 
            opacity: '0' 
          },
          '40%': { 
            transform: 'scale(1.02)', // 第一次冲过头 (模拟镜头伸出)
            filter: 'blur(2px)',      // 变清晰但还没完全清
            opacity: '1' 
          },
          '70%': { 
            transform: 'scale(0.98)', // 回缩 (模拟镜头校准)
            filter: 'blur(0.5px)',    // 几乎清晰
          },
          '100%': { 
            transform: 'scale(1)',    // 锁定
            filter: 'blur(0)',        // 完全清晰
            opacity: '1'
          },
        },
        'progress': {
          '0%': { width: '0%', opacity: '1' },
          '100%': { width: '100%', opacity: '0' },
        },
        // 四角动画：加大位移距离，保持冲击力
        'lock-tl': { '0%': { transform: 'translate(-50px, -50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
        'lock-tr': { '0%': { transform: 'translate(50px, -50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
        'lock-bl': { '0%': { transform: 'translate(-50px, 50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
        'lock-br': { '0%': { transform: 'translate(50px, 50px)', opacity: '0' }, '100%': { transform: 'translate(0, 0)', opacity: '1' } },
      },
      animation: {
        // 时间延长至 0.8s，使用 cubic-bezier 模拟机械惯性
        'tactical-zoom': 'tactical-zoom 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
        'progress': 'progress 1s ease-out forwards',
        // 角标延迟 0.1s 进场，让画面先“弹”出来，角标再“咔”地锁上
        'lock-tl': 'lock-tl 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards',
        'lock-tr': 'lock-tr 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards',
        'lock-bl': 'lock-bl 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards',
        'lock-br': 'lock-br 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s backwards',
      }
    },
  },
  plugins: [animate],
}