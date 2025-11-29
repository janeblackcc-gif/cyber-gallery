// src/particlesConfig.js

const goldParticlesConfig = {
  // 自动铺满全屏，且在最底层
  fullScreen: {
    enable: true,
    zIndex: 0, 
  },
  particles: {
    // === 粒子数量 ===
    number: {
      value: 120, // 粒子总数，根据需要增减
      density: {
        enable: true,
        area: 800,
      },
    },
    // === 颜色 (碎金配色) ===
    color: {
      value: ["#FFD700", "#FDB931", "#FFED8A"], // 采用多种金色，增加层次感
    },
    // === 形状 ===
    shape: {
      type: "circle", // 圆形碎屑
    },
    // === 透明度 (带闪烁效果) ===
    opacity: {
      value: { min: 0.3, max: 0.8 }, // 半透明，不抢镜
      animation: {
        enable: true,
        speed: 1, // 闪烁速度
        sync: false,
        mode: "auto",
        startValue: "random",
        destroy: "none",
      },
    },
    // === 大小 (大小不一) ===
    size: {
      value: { min: 1, max: 4 }, // 模拟不同大小的碎金
    },
    // === 连接线 (关闭) ===
    links: {
      enable: false, // 我们要的是飘落，不是蜘蛛网
    },
    // === 移动 (核心：缓慢下落的流体感) ===
    move: {
      enable: true,
      direction: "bottom", // 向下飘落
      speed: { min: 0.5, max: 1 }, // 速度有快有慢，制造层次
      random: false,
      straight: false, // 稍微有点蜿蜒，不是直线
      outModes: {
        default: "out", // 移出屏幕后重新从上面从头开始
      },
      gravity: {
        enable: false, // 开启重力感
      },
    },
  },
  // === 交互 (鼠标轻微排斥) ===
  interactivity: {
    events: {
      onHover: {
        enable: false,
        mode: "repulse", // 鼠标移上去时，金粉稍微散开一点点
      },
      resize: true,
    },
    modes: {
      repulse: {
        distance: 100,
        duration: 0.4,
      },
    },
  },
  detectRetina: true, // 高清屏适配
};

export default goldParticlesConfig;