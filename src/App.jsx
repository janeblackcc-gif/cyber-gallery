import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Camera, Aperture, Hash, X, Maximize2, ZoomIn, Move, Scan, Loader2, UploadCloud, Database, Play } from 'lucide-react'; 
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import goldParticlesConfig from './particlesConfig';

// ==========================================
// 🔧 配置区域
// ==========================================
const SPREADSHEET_ID = '1hhEkazIsn69rFmMx6zlcMR9Xt1_AmtOIruZkViJzr-Y'; 
const SHEET_NAME = 'Sheet1';
const UPLOAD_LINK = 'https://tally.so/r/A7rWWk'; 
const MANAGE_LINK = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

// 🛠️ 辅助函数：判断是不是视频
const isVideoFile = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  // 简单判断后缀，Tally 的链接通常包含文件扩展名
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
};

// 🎨 独立组件：智能媒体显示 (自动处理图片/视频/横竖屏)
const MediaItem = ({ src, alt, className, isHovered }) => {
  const isVideo = isVideoFile(src);

  if (isVideo) {
    return (
      <div className="relative w-full h-full">
        <video
          src={src}
          className={`${className} object-cover`} // 列表页强制裁切填满
          muted
          loop
          playsInline // 手机端必须加这个才能自动播放
          autoPlay={isHovered} // 只有鼠标悬停时才播放，节省性能（可选，也可设为 true 一直播放）
          ref={e => {
            if (e) {
              // 确保加载时是暂停的，hover时播放，或者直接设为 autoPlay={true} 让它一直动
              isHovered ? e.play().catch(()=>{}) : e.pause();
              // 如果想让它一直动，就把上面这行删了，直接写 <video autoPlay ... >
            }
          }}
        />
        {/* 视频角标提示 */}
        {!isHovered && (
          <div className="absolute top-2 right-2 bg-black/50 p-1 rounded-full backdrop-blur-sm">
             <Play size={12} className="text-white fill-white" />
          </div>
        )}
      </div>
    );
  }

  // 普通图片
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} // 接受外部传入的 object-cover
      loading="lazy" 
    />
  );
};

const CyberGallery = () => {
  const [photoData, setPhotoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  
  // 状态管理
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null); 
  const scaleRef = useRef(1);

  useEffect(() => { scaleRef.current = scale; }, [scale]);
  const particlesInit = useCallback(async engine => { await loadSlim(engine); }, []);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://opensheet.elk.sh/${SPREADSHEET_ID}/${SHEET_NAME}`);
        const data = await response.json();
        
        const mappedData = data.map((item, index) => ({
          id: item['Submission ID'] || index,
          title: item['标题'] || 'UNNAMED',
          date: item['日期'] || '2025.11.29',
          desc: item['描述'] || 'No description',
          src: item['文件上传']
        }));

        const validData = mappedData.filter(item => item.src && item.src.trim() !== '');
        if (validData.length > 0) setPhotoData(validData);
      } catch (error) {
        console.error("数据连接失败:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 滚轮修复
  useEffect(() => {
    const container = containerRef.current;
    if (!selectedPhoto || !container) return;
    const handleNativeWheel = (e) => {
      e.preventDefault(); e.stopPropagation();
      const currentScale = scaleRef.current; 
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(1, currentScale + delta), 5);
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    };
    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    document.body.style.overflow = 'hidden';
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhoto]);

  // 交互逻辑
  const handleMouseDown = (e) => { if (scale > 1) { e.preventDefault(); setIsDragging(true); dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y }; } };
  const handleMouseMove = (e) => { if (isDragging && scale > 1) { e.preventDefault(); setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }); } };
  const handleMouseUp = () => setIsDragging(false);
  const handleClose = () => { setSelectedPhoto(null); setScale(1); setPosition({ x: 0, y: 0 }); };
  const getCursorStyle = () => { if (scale <= 1) return 'cursor-default'; return isDragging ? 'cursor-grabbing' : 'cursor-grab'; };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 p-4 md:p-8 font-mono selection:bg-pink-500 selection:text-white relative overflow-hidden">
      
      <Particles id="tsparticles" init={particlesInit} options={goldParticlesConfig} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0" />
      
      <header className="relative z-10 mb-16 text-center">
        {/* 操作区 */}
        <div className="absolute top-0 right-0 md:top-4 md:right-4 flex flex-col md:flex-row gap-3 z-50">
           <a href={MANAGE_LINK} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 bg-zinc-900/10 backdrop-blur border border-zinc-300 hover:border-red-500 rounded-full transition-all duration-300 hover:bg-zinc-900 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer no-underline">
            <Database size={16} className="text-zinc-400 group-hover:text-red-500 transition-colors" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 group-hover:text-red-500">DATABASE</span>
          </a>
          <a href={UPLOAD_LINK} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur border border-zinc-300 hover:border-pink-500 rounded-full transition-all duration-300 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)] cursor-pointer no-underline">
            <UploadCloud size={16} className="text-zinc-400 group-hover:text-pink-500 transition-colors" />
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 group-hover:text-pink-600">UPLOAD</span>
          </a>
        </div>

        <div className="inline-flex items-center gap-2 border border-pink-500/30 bg-pink-500/10 px-4 py-1 rounded-full mb-6 backdrop-blur-sm">
          <div className={`w-2 h-2 bg-pink-600 rounded-full ${isLoading ? 'animate-ping' : 'animate-pulse'}`} />
          <span className="text-pink-600 text-xs tracking-[0.3em] font-bold">
            {isLoading ? 'ESTABLISHING UPLINK...' : 'VISUAL_LOGS // 影像档案'}
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-zinc-900 via-zinc-700 to-zinc-500 tracking-tighter uppercase transform -skew-x-6 drop-shadow-sm">
          YSRC-SZT GALLERY
        </h1>
      </header>

      {/* 列表渲染 */}
      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center justify-center h-64 gap-4 text-zinc-400">
          <Loader2 className="animate-spin text-pink-500" size={48} />
          <p className="text-xs tracking-[0.5em] animate-pulse">DOWNLOADING DATA PACKETS...</p>
        </div>
      ) : (
        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {photoData.map((photo) => (
            <div 
              key={photo.id} 
              className="group relative cursor-pointer"
              onClick={() => { setSelectedPhoto(photo); setScale(1); setPosition({ x: 0, y: 0 }); }}
            >
              <div className="relative overflow-hidden bg-white border border-zinc-200 hover:border-pink-500 transition-all duration-500 shadow-xl hover:shadow-[0_0_30px_rgba(236,72,153,0.15)] aspect-[2/3]"> 
                {/* aspect-[3/4] 强制竖向卡片比例，保证排版整齐 */}
                
                {/* ⚡️ 使用 MediaItem 组件，支持视频和图片 */}
                <MediaItem 
                  src={photo.src} 
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 ease-out"
                  isHovered={true} // 列表页让视频自动播放，产生LivePhoto效果
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 pointer-events-none">
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
      )}
      
      <footer className="mt-24 text-center text-zinc-400 text-[10px] tracking-[0.5em] uppercase">End of Transmission</footer>

      {/* 大图查看器 */}
      {selectedPhoto && (
        <div 
          ref={containerRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/95 backdrop-blur-md overflow-hidden animate-in fade-in duration-300 overscroll-contain"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] pointer-events-none" />

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

          <div 
            className={`relative w-full h-full flex items-center justify-center ${getCursorStyle()}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div 
              className="relative inline-block"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {/* ⚡️ 大图模式下处理视频 */}
              {isVideoFile(selectedPhoto.src) ? (
                 <video
                   src={selectedPhoto.src}
                   className="max-h-[80vh] max-w-[90vw] object-contain shadow-2xl border border-white/10 rounded-sm select-none animate-tactical-zoom will-change-transform"
                   autoPlay
                   loop
                   controls // 大图模式下显示播放条
                   playsInline
                 />
              ) : (
                <img 
                  src={selectedPhoto.src} 
                  alt={selectedPhoto.title}
                  className="max-h-[80vh] max-w-[90vw] object-contain shadow-2xl border border-white/10 rounded-sm select-none animate-tactical-zoom will-change-transform"
                  draggable="false" 
                />
              )}

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