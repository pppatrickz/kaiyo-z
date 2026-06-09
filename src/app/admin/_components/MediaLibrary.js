/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useRef, useEffect, useState } from "react";

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

function LazyMediaImage({ src, alt, className }) {
  const [isIntersecting, setIsIntersecting] = React.useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" } 
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <div className="w-full aspect-square bg-gray-100 rounded-lg overflow-hidden relative border border-gray-100">
      <img
        ref={imgRef}
        src={isIntersecting ? src : "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"}
        alt={alt || ""}
        className={classNames(
          "w-full h-full object-cover transition-opacity duration-200",
          isIntersecting ? "opacity-100" : "opacity-0",
          className
        )}
        onError={(e) => { e.target.style.opacity = '0.4'; }}
      />
    </div>
  );
}

export default function MediaLibrary({
  data,
  categoryOptions,
  activeMediaGroup,
  setActiveMediaGroup,
  isLibraryLoaded,
  loadExistingImages,
  pendingImages,
  setPendingImages, // 🎯 接收 Hook 以更改檔名
  activeWorkIndex,
  attachImageToWork,
  setIsMobileMediaOpen,
  addPendingFiles,
  getImageSrc,
  isClickScrollingRef,
  type
}) {
  const fileInputRef = useRef(null);
  const mediaScrollContainerRef = useRef(null);
  
  // 🎯 用於管理哪一張待上傳照片正在處於「改名狀態」
  const [editingImageId, setEditingImageId] = useState(null);
  const [tempName, setTempName] = useState("");

  useEffect(() => {
    if (!data || !data.categories || !isLibraryLoaded || !mediaScrollContainerRef.current) return;
    
    const container = mediaScrollContainerRef.current;
    const targets = container.querySelectorAll("[id^='media-group-']");
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (isClickScrollingRef.current !== false) return;
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const catId = entry.target.id.replace("media-group-", "");
            setActiveMediaGroup(catId);
          }
        });
      },
      { root: container, rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1] }
    );
    
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [isLibraryLoaded, data, setActiveMediaGroup, isClickScrollingRef]);

  const scrollToCategoryGroup = (catId) => {
    const container = mediaScrollContainerRef.current;
    const element = document.getElementById(`media-group-${catId}`);
    if (!element || !container) return;

    isClickScrollingRef.current = catId; 
    setActiveMediaGroup(catId);

    const targetScrollTop = element.offsetTop - 2;
    container.scrollTo({ top: targetScrollTop, behavior: "smooth" });

    let scrollTimeout;
    const cleanUpScrollListen = () => {
      container.removeEventListener("scroll", handleScrollCheck);
      if ('onscrollend' in window) container.removeEventListener("scrollend", handleScrollEndClean);
      setTimeout(() => { isClickScrollingRef.current = false; }, 60);
    };

    const handleScrollCheck = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(cleanUpScrollListen, 120);
    };

    const handleScrollEndClean = () => {
      clearTimeout(scrollTimeout);
      cleanUpScrollListen();
    };

    container.addEventListener("scroll", handleScrollCheck, { passive: true });
    if ('onscrollend' in window) container.addEventListener("scrollend", handleScrollEndClean, { once: true });
  };

  const handleMediaDragStart = (e, imgName, originCat = "") => {
    const targetWork = activeWorkIndex !== null ? data.works[activeWorkIndex] : null;
    let finalPayloadName = imgName;
    if (targetWork && originCat && targetWork.category !== originCat) {
      finalPayloadName = `${originCat}::${imgName}`;
    }
    e.dataTransfer.setData("text/plain", finalPayloadName);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleDropFiles = (files) => {
    const currentCategory = type === "works" 
      ? (activeWorkIndex !== null ? data.works[activeWorkIndex]?.category : "")
      : type; 
    addPendingFiles(files, currentCategory);
  };

  // 🎯 修改預計上傳檔案名稱的核心函數
  const renamePendingImage = (id, oldName) => {
    if (!tempName.trim() || tempName === oldName) {
      setEditingImageId(null);
      return;
    }
    
    // 保留原始副檔名，防呆
    const ext = oldName.substring(oldName.lastIndexOf("."));
    let newName = tempName.trim();
    if (!newName.endsWith(ext)) {
      newName += ext;
    }

    if (setPendingImages) {
      setPendingImages(prev => prev.map(img => img.id === id ? { ...img, name: newName } : img));
    }
    setEditingImageId(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full max-h-full relative">
      <div 
        className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition mb-4 shrink-0" 
        onDragOver={e => e.preventDefault()} 
        onDrop={e => { e.preventDefault(); e.dataTransfer.files && handleDropFiles(e.dataTransfer.files); }} 
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="text-xs text-gray-400 font-medium block">拖曳或點擊此區塊上傳新圖</span>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleDropFiles(e.target.files)} />
      </div>

      {!isLibraryLoaded ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-gray-50/40 rounded-xl space-y-3">
          <p className="text-xs text-gray-400 max-w-[240px] leading-relaxed">為了節省 R2 下載用量，媒體櫃預設關閉。</p>
          <button type="button" className="px-4 py-2 rounded-full bg-black text-white text-[11px] font-medium transition shadow-xs" onClick={loadExistingImages}>🔍 載入所有現現有圖片庫</button>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 shrink-0 pb-3 border-b border-gray-100 mb-3 select-none">
            <button type="button" className={classNames("px-2.5 py-1 rounded-full text-[10px] font-medium transition", activeMediaGroup === "all" ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200")} onClick={() => scrollToCategoryGroup("all")}>★ 待上傳</button>
            {categoryOptions.map(opt => (
              <button key={`media-lbl-${opt.id}`} type="button" className={classNames("px-2.5 py-1 rounded-full text-[10px] font-medium transition", activeMediaGroup === opt.id ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200")} onClick={() => scrollToCategoryGroup(opt.id)}>
                {data.categories[opt.id]?.zh || opt.label}
              </button>
            ))}
          </div>

          <div ref={mediaScrollContainerRef} className="relative flex-1 overflow-y-auto pr-1 space-y-6 select-none scroll-smooth">
            {/* ✨ 待儲存同步新圖區塊 */}
            <div id="media-group-all" className="space-y-2 border-b border-gray-100 pb-4">
              <span className="text-[10px] font-bold text-amber-600 tracking-wider block uppercase">✨ 待儲存同步新圖 ({pendingImages.length})</span>
              {pendingImages.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {pendingImages.map(img => (
                    <div 
                      key={img.id} draggable onDragStart={(e) => handleMediaDragStart(e, img.name, "")}
                      className="border border-amber-300 rounded-xl overflow-hidden text-[10px] text-center bg-white p-1 space-y-1 relative cursor-grab active:cursor-grabbing group flex flex-col justify-between"
                    >
                      <div onClick={() => { attachImageToWork(img.name); setIsMobileMediaOpen(false); }}>
                        <LazyMediaImage src={img.url} className="pointer-events-none" />
                      </div>
                      
                      {/* 🎯 檔名與修改檔名輸入框元件 */}
                      <div className="px-1 text-left">
                        {editingImageId === img.id ? (
                          <div className="flex gap-1 mt-1" onClick={e => e.stopPropagation()}>
                            <input 
                              type="text" 
                              className="w-full border border-gray-300 rounded px-1 py-0.5 text-[9px] font-mono focus:outline-none" 
                              value={tempName} 
                              onChange={e => setTempName(e.target.value)}
                              onBlur={() => renamePendingImage(img.id, img.name)}
                              onKeyDown={e => e.key === "Enter" && renamePendingImage(img.id, img.name)}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1 group/name">
                            <div className="truncate font-mono text-[9px] text-gray-600 font-bold pointer-events-none">{img.name}</div>
                            <button 
                              type="button" 
                              className="text-amber-600 hover:text-amber-800 text-[9px] font-sans scale-90 opacity-0 group-hover/name:opacity-100 transition"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingImageId(img.id);
                                setTempName(img.name.substring(0, img.name.lastIndexOf(".")) || img.name);
                              }}
                            >
                              ✏️
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-[10px] text-gray-400 italic">目前無任何待同步檔案。</p>}
            </div>

            {/* 歷史圖庫區塊 */}
            {categoryOptions.map(opt => {
              const groupImages = data.works.filter(w => w.category === opt.id).flatMap(w => w.images || []).map(img => img.includes("::") ? img.split("::")[1] : img).filter((value, index, self) => value && self.indexOf(value) === index);
              return (
                <div key={`media-grp-box-${opt.id}`} id={`media-group-${opt.id}`} className="space-y-2 scroll-mt-4">
                  <span className="text-[11px] font-bold text-gray-800 block border-l-2 border-black pl-2 tracking-wide">{data.categories[opt.id]?.zh || opt.label} ({groupImages.length})</span>
                  {groupImages.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {groupImages.map(imgName => {
                        const imgSrc = getImageSrc({ type: type, category: opt.id, fileName: imgName });
                        return (
                          <div 
                            key={`img-item-${opt.id}-${imgName}`} draggable onDragStart={(e) => handleMediaDragStart(e, imgName, opt.id)}
                            className="border border-gray-100 rounded-xl overflow-hidden text-[10px] text-center bg-gray-50 hover:border-gray-300 transition p-1 space-y-1 relative cursor-grab active:cursor-grabbing group"
                            onClick={() => {
                              const targetWork = data?.works?.[activeWorkIndex];
                              const finalName = (targetWork && targetWork.category === opt.id) ? imgName : `${opt.id}::${imgName}`;
                              attachImageToWork(finalName);
                              setIsMobileMediaOpen(false);
                            }}
                          >
                            <LazyMediaImage src={imgSrc} className="pointer-events-none" />
                            <div className="px-1 truncate font-mono text-[9px] text-gray-500 pointer-events-none">{imgName}</div>
                            <button type="button" className="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 text-[9px] transition grid place-items-center rounded-xl font-medium">加入此圖</button>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-[10px] text-gray-400 italic pl-2">該分類下目前無檔案。</p>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}