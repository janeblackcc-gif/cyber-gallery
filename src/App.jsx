import React from 'react';
import { Camera, Aperture, Hash } from 'lucide-react';

// ==========================================
// 🔧 你的照片数据 (请根据实际文件名修改)
// ==========================================
const PHOTO_DATA = [
  { 
    id: 1, 
    src: '/cyber-gallery/photos/1.jpg',  // 确保文件名对应
    title: 'MENBER INTRO 1', 
    date: '2025.11.29', 
    desc: 'YSRC-SZT全员集结' 
  },
  { 
    id: 2, 
    src: '/cyber-gallery/photos/2.jpg', 
    title: 'MENBER INTRO 2', 
    date: '2024.11.29', 
    desc: 'YSRC-SZT全员集结' 
  },
 { 
    id: 1, 
    src: '/cyber-gallery/photos/3.jpg',  // 确保文件名对应
    title: 'MENBER INTRO 3', 
    date: '2024.11.29, 
    desc: 'YSRC-SZT全员集结 ' 
  },

];
// ==========================================

const CyberGallery = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-mono selection:bg-pink-500 selection:text-white">
      
      {/* 背景特效 */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />

      {/* 标题 */}
      <header className="relative z-10 mb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-pink-500/20 bg-pink-500/5 px-4 py-1 rounded-full mb-6 backdrop-blur-sm">
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
          <span className="text-pink-500 text-xs tracking-[0.3em] font-bold">VISUAL_LOGS // 影像档案</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-600 tracking-tighter uppercase transform -skew-x-6 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          YSRC GALLERY
        </h1>
      </header>

      {/* 瀑布流布局 */}
      <div className="relative z-10 max-w-7xl mx-auto columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {PHOTO_DATA.map((photo) => (
          <div key={photo.id} className="break-inside-avoid mb-6 group relative">
            <div className="relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-pink-500/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_30px_rgba(236,72,153,0.2)]">
              {/* 图片 */}
              <img 
                src={photo.src} 
                alt={photo.title} 
                className="w-full h-auto object-cover grayscale-[80%] contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                loading="lazy"
              />
              {/* 悬停文字 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                  <div className="flex items-center gap-2 mb-2 text-pink-400">
                    <Hash size={12} />
                    <span className="text-[10px] tracking-[0.2em]">{photo.date}</span>
                  </div>
                  <h3 className="text-white font-bold text-xl tracking-wide font-sans italic uppercase mb-1">
                    {photo.title}
                  </h3>
                  <p className="text-zinc-400 text-xs font-mono">
                    {photo.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <footer className="mt-24 text-center text-zinc-700 text-[10px] tracking-[0.5em] uppercase">
        End of Transmission
      </footer>
    </div>
  );
};

export default CyberGallery;