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
    id: 3, 
    src: '/cyber-gallery/photos/3.jpg',  // 确保文件名对应
    title: 'MENBER INTRO 3', 
    date: '2024.11.29', 
    desc: 'YSRC-SZT全员集结 ' 
  },
 { 
    id: 4, 
    src: '/cyber-gallery/photos/0.jpg',  // 确保文件名对应
    title: 'TRAINING CLIP', 
    date: '2024.11.29', 
    desc: 'YSRC-SZT Daily training ' 
  },
];
// ==========================================

const CyberGallery = () => {
 return (
    // 1. 背景改为浅灰 bg-zinc-50，文字改为深色 text-zinc-900
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-4 md:p-8 font-mono selection:bg-pink-500 selection:text-white">
      
      {/* 2. 背景网格改为深色线条 */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />

      {/* 标题 */}
      <header className="relative z-10 mb-16 text-center">
        <div className="inline-flex items-center gap-2 border border-pink-500/30 bg-pink-500/10 px-4 py-1 rounded-full mb-6 backdrop-blur-sm">
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-pulse" />
          <span className="text-pink-600 text-xs tracking-[0.3em] font-bold">VISUAL_LOGS // 影像档案</span>
        </div>
        {/* 标题改为深色渐变 */}
        <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 tracking-tighter uppercase transform -skew-x-6 drop-shadow-sm">
          YSRC GALLERY
        </h1>
      </header>

      {/* 瀑布流布局 */}
      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PHOTO_DATA.map((photo) => (
          <div key={photo.id} className="group relative">
            
            {/* 3. 卡片背景改为纯白，边框改为浅灰，增加投影 */}
            <div className="relative overflow-hidden bg-white border border-zinc-200 hover:border-pink-500 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]">
              
              {/* 图片 */}
              <img 
                src={photo.src} 
                alt={photo.title} 
                className="w-full h-auto grayscale-[80%] contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                loading="lazy"
              />

              {/* 悬停层 */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                
                {/* 文字改为深色 */}
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                  <div className="flex items-center gap-2 mb-2 text-pink-600">
                    <Hash size={12} />
                    <span className="text-[10px] tracking-[0.2em]">{photo.date}</span>
                  </div>
                  <h3 className="text-zinc-900 font-bold text-xl tracking-wide font-sans italic uppercase mb-1">
                    {photo.title}
                  </h3>
                  <p className="text-zinc-500 text-xs font-mono">
                    {photo.desc}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <footer className="mt-24 text-center text-zinc-400 text-[10px] tracking-[0.5em] uppercase">
        End of Transmission
      </footer>
    </div>
  );
};

export default CyberGallery;