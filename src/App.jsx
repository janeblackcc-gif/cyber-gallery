import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, Move, Loader2, UploadCloud, Database, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
};

// 🛠️ 辅助函数：基于 ID 生成稳定的随机旋转角度（-5° ~ +5°）
const getRotation = (seed) => {
  const seedStr = String(seed);
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash * 31 + seedStr.charCodeAt(i)) % 1000;
  }
  return (hash / 1000) * 10 - 5;
};

// 🎨 独立组件：智能媒体显示 (自动处理图片/视频/横竖屏)
const MediaItem = ({ src, alt, className, isHovered }) => {
  const isVideo = isVideoFile(src);

  if (isVideo) {
    return (
      <div className="relative w-full h-full">
        <video
          src={src}
          className={`${className} object-cover`}
          muted
          loop
          playsInline
          autoPlay={isHovered}
          draggable={false}
          ref={e => {
            if (e) {
              isHovered ? e.play().catch(()=>{}) : e.pause();
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
      className={className}
      loading="lazy"
      draggable={false}
    />
  );
};

const CyberGallery = () => {
  const [photoData, setPhotoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  // 状态管理
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const scaleRef = useRef(1);
  const isGridDragging = useRef(false);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

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
    <div className="min-h-screen bg-stone-50 text-stone-800 p-4 md:p-8 font-sans selection:bg-amber-200 relative">
      
      <header className="relative z-10 mb-12 text-center">
        {/* 操作区 */}
        <div className="absolute top-0 right-0 md:top-4 md:right-4 flex flex-col md:flex-row gap-3 z-50">
           <a href={MANAGE_LINK} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-full transition-all duration-200 hover:border-stone-400 cursor-pointer no-underline shadow-sm">
            <Database size={16} className="text-stone-400 group-hover:text-stone-700 transition-colors" />
            <span className="text-xs font-semibold tracking-wider text-stone-500 group-hover:text-stone-700 uppercase">Database</span>
          </a>
          <a href={UPLOAD_LINK} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 rounded-full transition-all duration-200 hover:border-stone-400 cursor-pointer no-underline shadow-sm">
            <UploadCloud size={16} className="text-stone-400 group-hover:text-stone-700 transition-colors" />
            <span className="text-xs font-semibold tracking-wider text-stone-500 group-hover:text-stone-700 uppercase">Upload</span>
          </a>
        </div>

        <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-stone-800">
          YSRC-SZT GALLERY
        </h1>
        {isLoading && (
          <p className="mt-2 text-sm text-stone-500">Loading photos...</p>
        )}
      </header>

      {/* 列表渲染 */}
      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center justify-center h-64 gap-4 text-stone-500">
          <Loader2 className="animate-spin text-stone-500" size={48} />
          <p className="text-sm">Loading photos...</p>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap justify-center items-center gap-x-10 gap-y-20 px-4 pb-20">
          {photoData.map((photo) => {
            const rotation = getRotation(photo.id);
            return (
              <motion.div
                key={photo.id}
                className="group relative cursor-pointer"
                initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
                whileInView={{ opacity: 1, scale: 1, rotate: rotation }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 20,
                  mass: 1
                }}
                whileHover={{ scale: 1.05, rotate: rotation * 1.2 }}
                whileTap={{ scale: 1 }}
                drag
                dragSnapToOrigin
                dragElastic={0.2}
                onHoverStart={() => setHoveredId(photo.id)}
                onHoverEnd={() => setHoveredId(null)}
                onDragStart={() => { isGridDragging.current = true; }}
                onDragEnd={() => { setTimeout(() => { isGridDragging.current = false; }, 150); }}
                onTap={() => {
                  if (!isGridDragging.current) {
                    setSelectedPhoto(photo);
                    setScale(1);
                    setPosition({ x: 0, y: 0 });
                  }
                }}
              >
                {/* 白色相框 */}
                <div className="bg-white p-5 shadow-xl">
                  <MediaItem
                    src={photo.src}
                    alt={photo.title}
                    className="block max-h-[300px] w-auto object-contain"
                    isHovered={hoveredId === photo.id}
                  />
                  {/* 底部标签 */}
                  {photo.title && (
                    <div className="mt-3 text-right">
                      <h3 className="text-base font-semibold text-stone-700">
                        {photo.title}
                      </h3>
                      {photo.date && (
                        <p className="text-xs text-stone-500 font-light mt-1">
                          {photo.date}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <footer className="mt-20 text-center text-stone-500 text-xs tracking-wide uppercase">End of Wall</footer>

      {/* 大图查看器 */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-hidden"
            onClick={handleClose}
          >
            <button
              onClick={handleClose}
              aria-label="Close"
              className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-50 p-2 bg-black/30 rounded-full cursor-pointer hover:bg-black/50"
            >
              <X size={32} />
            </button>

            <div className="absolute top-6 left-6 flex flex-col gap-2 text-white/70 text-xs tracking-widest z-50 pointer-events-none select-none">
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
                    className="max-h-[85vh] max-w-[92vw] object-contain shadow-2xl border border-white/10 rounded-md select-none"
                    autoPlay
                    loop
                    controls
                    playsInline
                  />
                ) : (
                  <img
                    src={selectedPhoto.src}
                    alt={selectedPhoto.title}
                    className="max-h-[85vh] max-w-[92vw] object-contain shadow-2xl border border-white/10 rounded-md select-none"
                    draggable="false"
                  />
                )}
              </div>
            </div>

            {scale === 1 && (
              <div className="absolute bottom-6 right-6 text-right text-white/80 pointer-events-none">
                <h2 className="text-lg font-semibold">
                  {selectedPhoto.title}
                </h2>
                <div className="mt-1 text-xs text-white/60">
                  {selectedPhoto.date} / {selectedPhoto.desc}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CyberGallery;