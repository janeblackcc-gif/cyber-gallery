import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ZoomIn, Move, Loader2, UploadCloud, Database, Play, Search, SortAsc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ==========================================
// 🔧 配置区域
// ==========================================
const SPREADSHEET_ID = '1hhEkazIsn69rFmMx6zlcMR9Xt1_AmtOIruZkViJzr-Y'; 
const SHEET_NAME = 'Sheet1';
const UPLOAD_LINK = 'https://5ac74b7d.cyber-gallery-upload-page.pages.dev'; 
const MANAGE_LINK = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;

// 🛠️ 辅助函数：判断是不是视频
const isVideoFile = (url) => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.mp4') || lowerUrl.includes('.mov') || lowerUrl.includes('.webm');
};

// 🛠️ 辅助函数：解析日期为时间戳
const parseDate = (dateStr) => {
  if (!dateStr) return 0;
  const normalized = String(dateStr).trim().replace(/[./]/g, '-');
  const timestamp = Date.parse(normalized);
  return isNaN(timestamp) ? 0 : timestamp;
};

// 🛠️ 辅助函数：提取年份和月份
const extractYearMonth = (dateStr) => {
  if (!dateStr) return null;
  const normalized = String(dateStr).trim().replace(/[./]/g, '-');
  const match = normalized.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  return { year, month };
};

// 🛠️ 辅助函数：标准化文本用于搜索
const normalizeText = (text) => {
  return String(text || '').toLowerCase().trim().replace(/\s+/g, ' ');
};

// 🛠️ 辅助函数：获取媒体类型
const getMediaType = (url) => isVideoFile(url) ? 'video' : 'image';

// 🛠️ 辅助函数：获取月份名称
const getMonthName = (monthNum) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[Number(monthNum) - 1] || '';
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
  const [showModalAnimation, setShowModalAnimation] = useState(false);

  // 搜索和过滤状态
  const [searchTerm, setSearchTerm] = useState("");
  const [mediaFilter, setMediaFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);

  // 状态管理
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const scaleRef = useRef(1);
  const isGridDragging = useRef(false);

  useEffect(() => { scaleRef.current = scale; }, [scale]);

  // 控制 Modal 动画
  useEffect(() => {
    if (selectedPhoto) {
      setShowModalAnimation(true);
      const timer = setTimeout(() => setShowModalAnimation(false), 900);
      return () => clearTimeout(timer);
    }
  }, [selectedPhoto]);

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

  // 生成时间线数据
  const timelineData = useMemo(() => {
    const years = new Map();
    photoData.forEach((photo) => {
      const ym = extractYearMonth(photo.date);
      if (!ym) return;
      const yearKey = String(ym.year);
      if (!years.has(yearKey)) {
        years.set(yearKey, { year: ym.year, count: 0, months: new Map() });
      }
      const yearEntry = years.get(yearKey);
      yearEntry.count += 1;
      const monthKey = String(ym.month).padStart(2, '0');
      yearEntry.months.set(monthKey, (yearEntry.months.get(monthKey) || 0) + 1);
    });
    return Array.from(years.values())
      .sort((a, b) => b.year - a.year)
      .map((yearEntry) => ({
        year: yearEntry.year,
        count: yearEntry.count,
        months: Array.from(yearEntry.months.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => Number(a.month) - Number(b.month))
      }));
  }, [photoData]);

  // 过滤和排序逻辑
  const filteredAndSorted = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    let filtered = photoData.filter((photo) => {
      const searchable = normalizeText(`${photo.title} ${photo.desc} ${photo.date}`);
      const matchesSearch = normalizedSearch ? searchable.includes(normalizedSearch) : true;

      const type = getMediaType(photo.src);
      const matchesMedia = mediaFilter === 'ALL' ? true : type === mediaFilter.toLowerCase();

      const ym = extractYearMonth(photo.date);
      const matchesYear = selectedYear ? (ym && String(ym.year) === String(selectedYear)) : true;
      const matchesMonth = selectedMonth ? (ym && String(ym.month).padStart(2, '0') === String(selectedMonth).padStart(2, '0')) : true;
      const matchesTimeline = matchesYear && matchesMonth;

      return matchesSearch && matchesMedia && matchesTimeline;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'OLDEST') return parseDate(a.date) - parseDate(b.date);
      if (sortBy === 'AZ') return normalizeText(a.title).localeCompare(normalizeText(b.title));
      return parseDate(b.date) - parseDate(a.date);
    });

    return sorted;
  }, [photoData, searchTerm, mediaFilter, sortBy, selectedYear, selectedMonth]);

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

      {/* 搜索和过滤区 */}
      <div className="w-full max-w-4xl mx-auto mb-12 px-4 relative z-20">
        <motion.div
          className="relative flex flex-col gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* 搜索框 */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-stone-400 group-focus-within:text-amber-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="SEARCH ARCHIVE..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 md:py-4 pl-12 pr-12 bg-white/50 backdrop-blur-sm border border-stone-300 rounded-full
                         text-stone-800 placeholder-stone-400 font-mono text-sm tracking-wider
                         focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10
                         transition-all shadow-sm hover:shadow-md"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-4 flex items-center text-stone-400 hover:text-stone-600"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* 过滤控制栏 */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs tracking-widest">
            {/* 媒体类型过滤 */}
            <div className="flex gap-2 p-1 bg-white/50 rounded-full border border-stone-200 backdrop-blur-sm">
              {['ALL', 'IMAGE', 'VIDEO'].map((type) => (
                <button
                  key={type}
                  onClick={() => setMediaFilter(type)}
                  className={`px-4 py-1.5 rounded-full transition-all duration-300 ${
                    mediaFilter === type
                      ? 'bg-stone-800 text-stone-50 shadow-md'
                      : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* 排序和统计 */}
            <div className="flex items-center gap-4">
              <div className="relative flex items-center gap-2 group">
                <SortAsc size={14} className="text-stone-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-transparent border-none text-stone-600 font-semibold focus:ring-0 cursor-pointer pr-4 hover:text-amber-600 transition-colors uppercase"
                  aria-label="Sort by"
                >
                  <option value="NEWEST">Newest</option>
                  <option value="OLDEST">Oldest</option>
                  <option value="AZ">Title A-Z</option>
                </select>
              </div>

              <div className="h-4 w-px bg-stone-300" />

              <span className="text-stone-400 font-mono">
                {filteredAndSorted.length} RESULTS
              </span>

              {(mediaFilter !== 'ALL' || searchTerm) && (
                <button
                  onClick={() => { setMediaFilter('ALL'); setSearchTerm(''); }}
                  className="text-amber-600 hover:text-amber-700 font-semibold border-b border-amber-600/30 hover:border-amber-600 transition-colors"
                >
                  RESET
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 时间线导航 */}
      <div className="w-full max-w-5xl mx-auto mb-16 px-4 relative z-20">
        <div className="flex flex-col items-center gap-4">
          {/* 年份选择器 */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:justify-center pb-2 scrollbar-thin scrollbar-thumb-stone-300">
            <button
              onClick={() => { setSelectedYear(null); setSelectedMonth(null); }}
              className={`flex-shrink-0 px-3 py-1.5 text-xs font-mono font-bold tracking-widest border rounded-md transition-all focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                !selectedYear
                  ? 'bg-stone-800 text-stone-50 border-stone-800'
                  : 'text-stone-400 border-stone-300 hover:text-stone-600 hover:border-stone-400'
              }`}
            >
              ALL TIME
            </button>

            <div className="w-px h-4 bg-stone-300 flex-shrink-0 mx-1" />

            {timelineData.map(({ year, count }) => (
              <button
                key={year}
                onClick={() => {
                  if (selectedYear === year) {
                    setSelectedYear(null);
                    setSelectedMonth(null);
                  } else {
                    setSelectedYear(year);
                    setSelectedMonth(null);
                  }
                }}
                className={`flex-shrink-0 px-4 py-1.5 text-xs font-mono transition-all rounded-md border focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                  selectedYear === year
                    ? 'bg-amber-100 text-amber-800 border-amber-300 font-bold'
                    : 'text-stone-500 border-transparent hover:bg-stone-100 hover:text-stone-700'
                }`}
              >
                {year} <span className="opacity-50 ml-1">({count})</span>
              </button>
            ))}
          </div>

          {/* 月份选择器 */}
          <AnimatePresence>
            {selectedYear && timelineData.find(d => d.year === selectedYear) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2 flex-wrap justify-center overflow-hidden"
              >
                {timelineData
                  .find(d => d.year === selectedYear)
                  ?.months.map(({ month, count }) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(selectedMonth === month ? null : month)}
                      className={`text-[10px] tracking-widest px-3 py-2 rounded transition-all uppercase font-mono focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                        selectedMonth === month
                          ? 'bg-stone-800 text-stone-50'
                          : 'text-stone-400 hover:text-amber-600 hover:bg-stone-50'
                      }`}
                    >
                      {getMonthName(month)} ({count})
                    </button>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 列表渲染 */}
      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center justify-center h-64 gap-4 text-stone-500">
          <Loader2 className="animate-spin text-stone-500" size={48} />
          <p className="text-sm">Loading photos...</p>
        </div>
      ) : (
        <div className="relative z-10 mx-auto flex max-w-6xl flex-wrap justify-center items-center gap-x-10 gap-y-20 px-4 pb-20">
          {filteredAndSorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-stone-400">
              <Search size={48} className="opacity-30" />
              <p className="text-sm tracking-widest uppercase">No results found</p>
              {(mediaFilter !== 'ALL' || searchTerm || selectedYear) && (
                <button
                  onClick={() => { setMediaFilter('ALL'); setSearchTerm(''); setSelectedYear(null); setSelectedMonth(null); }}
                  className="text-amber-600 hover:text-amber-700 font-semibold text-xs tracking-wider uppercase border-b border-amber-600/30 hover:border-amber-600"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            filteredAndSorted.map((photo) => {
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
          })
          )}
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
            style={{ overscrollBehavior: 'contain' }}
            onClick={handleClose}
          >
            {/* 进度条 */}
            {showModalAnimation && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/30 overflow-hidden z-50">
                <div className="h-full bg-gradient-to-r from-amber-400 to-amber-600 animate-progress" />
              </div>
            )}

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
                className={`relative inline-block ${showModalAnimation ? 'animate-tactical-zoom' : ''}`}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                {/* 四角锁定装饰 */}
                {showModalAnimation && (
                  <>
                    <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-amber-400/60 animate-lock-tl pointer-events-none" />
                    <div className="absolute -top-4 -right-4 w-8 h-8 border-t-2 border-r-2 border-amber-400/60 animate-lock-tr pointer-events-none" />
                    <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-2 border-l-2 border-amber-400/60 animate-lock-bl pointer-events-none" />
                    <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-amber-400/60 animate-lock-br pointer-events-none" />
                  </>
                )}

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