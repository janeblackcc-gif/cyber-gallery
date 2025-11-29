import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Camera, Aperture, Hash, X, Maximize2, ZoomIn, Move, Scan } from 'lucide-react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import goldParticlesConfig from './particlesConfig';

// ==========================================
// 🔧 你的照片数据
// ==========================================
const PHOTO_DATA = [
  { 
    id: 1, 
    src: '/cyber-gallery/photos/1.jpg', 
    title: 'MEMBER INTRO 1', 
    date: '2025.11.29', 
    desc: 'YSRC-SZT全员集结' 
  },
  { 
    id: 2, 
    src: '/cyber-gallery/photos/2.jpg', 
    title: 'MEMBER INTRO 2', 
    date: '2024.11.29', 
    desc: 'YSRC-SZT全员集结' 
  },
  { 
    id: 3, 
    src: '/cyber-gallery/photos/3.jpg', 
    title: 'MEMBER INTRO 3', 
    date: '2024.11.29', 
    desc: 'YSRC-SZT全员集结' 
  },
  { 
    id: 4, 
    src: '/cyber-gallery/photos/0.jpg', 
    title: 'TRAINING CLIP', 
    date: '2024.11.29', 
    desc: 'YSRC-SZT Daily training' 
  },
];

const CyberGallery = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // 状态管理
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const particlesInit = useCallback(async engine => {
    await loadSlim(engine);
  }, []);

  // 滚动锁定
  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedPhoto]);

  // 滚轮缩放
  const handleWheel = (e) => {
    e.stopPropagation(); 
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(Math.max(1, scale + delta), 5);
    setScale(newScale);
    if (newScale === 1) setPosition({ x: 0, y: 0 });
  };

  // 拖拽逻辑
  const handleMouseDown = (e) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      e.preventDefault();
      setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // 关闭逻辑
  const handleClose = () => {
    setSelectedPhoto(null);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-4 md:p-8 font-mono selection:bg-pink-500 selection:text-white relative overflow-hidden">
      
      {/* 背景层 */}
      <Particles id="tsparticles" init={particlesInit} options={goldParticlesConfig} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />
      
      {/* 标题 */}
      <header className="relative z-10 mb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-pink-500/30 bg-pink-500/10 px-4 py-1 rounded-full mb-6 backdrop-blur-sm">
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" />
          <span className="text-pink-600 text-xs tracking-[0.3em] font-bold">VISUAL_LOGS // 影像档案</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 tracking-tighter uppercase transform -skew-x-6 drop-shadow-sm">
          YSRC-SZT GALLERY
        </h1>
      </header>

      {/* 列表布局 */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PHOTO_DATA.map((photo) => (
          <div 
            key={photo.id} 
            className="group relative cursor-pointer"
            onClick={() => { setSelectedPhoto(photo); setScale(1); setPosition({ x: 0, y: 0 }); }}
          >
            <div className="relative overflow-hidden bg-white border border-zinc-200 hover:border-pink-500 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]">
              {/* 列表图片去掉滤镜 */}
              <img src={photo.src} alt={photo.title} className="w-full h-auto group-hover:scale-105 transition-all duration-700 ease-out" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/80 p-3 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform duration-300 delay-100 backdrop-blur-md">
                  <Maximize2 size={24} className="text-zinc-900" />
                </div>
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                  <div className="flex items-center gap-2 mb-2 text-pink-600">
                    <Hash size={12} />
                    <span className="text-[10px] tracking-[0.2em]">{photo.date}</span>
                  </div>
                  <h3 className="text-zinc-900 font-bold text-xl tracking-wide font-sans italic uppercase mb-1">{photo.title}</h3>
                  <p className="text-zinc-500 text-xs font-mono">{photo.desc}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <footer className="mt-24 text-center text-zinc-400 text-[10px] tracking-[0.5em] uppercase">End of Transmission</footer>

      {/* === 大图查看器 (重构版：解决动画冲突) === */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-300"
          onClick={handleClose}
          onWheel={(e) => e.stopPropagation()} 
        >
          {/* 背景战术网格 */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

          {/* 顶部操作区 */}
          <button className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors z-50 p-2 bg-black/20 rounded-full cursor-pointer hover:bg-pink-500 hover:rotate-90 duration-300">
            <X size={32} />
          </button>

          <div className="absolute top-6 left-6 flex flex-col gap-2 text-zinc-500 text-xs font-mono tracking-widest z-50 pointer-events-none select-none">
            <div className="flex items-center gap-2 text-pink-500 animate-pulse">
              <Scan size={16} />
              <span>TARGET LOCKED</span>
            </div>
            <div className="flex items-center gap-2">
              <ZoomIn size={16} />
              <span>ZOOM: {Math.round(scale * 100)}%</span>
            </div>
            {scale > 1 && (
              <div className="flex items-center gap-2 text-white">
                <Move size={16} />
                <span>DRAG TO PAN</span>
              </div>
            )}
          </div>

          {/* 图片交互层容器 */}
          <div 
            className="relative w-full h-full flex items-center justify-center cursor-move"
            onClick={(e) => e.stopPropagation()}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* 🔴 核心修改：Interactive Wrapper (负责拖拽和缩放) */}
            <div 
              className="relative inline-block"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`, // 仅负责交互变形
                transition: isDragging ? 'none' : 'transform 0.1s ease-out' // 拖拽时无延迟
              }}
            >
              {/* 🔴 内部 Image：负责入场动画 (tactical-zoom) */}
              {/* 注意：去掉了所有 transform 相关的样式，交给父级 div 处理 */}
              <img 
                src={selectedPhoto.src} 
                alt={selectedPhoto.title}
                className="max-h-[80vh] max-w-[90vw] object-contain shadow-2xl border border-white/10 rounded-sm select-none animate-tactical-zoom will-change-transform" // 这里的动画现在是纯净的
                draggable="false" 
              />

              {/* 🔴 内部四角：放在 Wrapper 里，随图片一起缩放 */}
              {scale === 1 && (
                <>
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-pink-500 rounded-tl-lg animate-lock-tl" />
                  <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-pink-500 rounded-tr-lg animate-lock-tr" />
                  <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-pink-500 rounded-bl-lg animate-lock-bl" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-pink-500 rounded-br-lg animate-lock-br" />
                </>
              )}
            </div>
          </div>

          {/* 底部信息 (固定在屏幕底部，不随图片缩放) */}
          {scale === 1 && (
            <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none animate-in slide-in-from-bottom-8 duration-500 fade-in">
              <h2 className="text-white text-2xl font-black italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                {selectedPhoto.title}
              </h2>
              <div className="flex items-center justify-center gap-4 mt-2 text-zinc-400 text-xs tracking-widest font-mono">
                <span className="text-pink-500">{selectedPhoto.date}</span>
                <span className="text-zinc-600">/</span>
                <span>{selectedPhoto.desc}</span>
              </div>
              <div className="w-64 h-1 bg-zinc-800 mx-auto mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 w-full animate-progress" style={{width: '0%'}} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CyberGallery;