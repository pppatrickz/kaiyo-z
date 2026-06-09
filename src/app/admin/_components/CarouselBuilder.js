/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useAdminModule, getImageSrc } from "../_hooks/useAdminModule"; 
import MediaLibrary from "./MediaLibrary"; 

const emptyI18n = () => ({ en: "", ja: "", zh: "" });

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function CarouselBuilder({ isCloud }) {
  const fileInputRef = useRef(null);
  const draggingIndexRef = useRef(null);
  
  const [activeIndex, setActiveIndex] = useState(0); 
  const [activeMediaGroup, setActiveMediaGroup] = useState("all"); 
  const [isMobileMediaOpen, setIsMobileMediaOpen] = useState(false); 
  const [leftPanelWidth, setLeftPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const isClickScrollingRef = useRef(false);

  const extractImagesFn = useCallback((slidesArray) => {
    if (!Array.isArray(slidesArray)) return [];
    const allImgs = new Set();
    slidesArray.forEach(s => {
      if (s.image) allImgs.add(s.image);
    });
    return Array.from(allImgs);
  }, []);

  const sanitizeAndSyncCarousel = useCallback((cloudData) => {
    if (!Array.isArray(cloudData)) return [];
    return cloudData.map(s => ({
      image: s.image || "",
      title: {
        en: s.title?.en || "",
        ja: s.title?.ja || "",
        zh: s.title?.zh || ""
      },
      desc: {
        en: s.desc?.en || "",
        ja: s.desc?.ja || "",
        zh: s.desc?.zh || ""
      }
    }));
  }, []);

  const {
    jsonData: slides,
    setJsonData: setSlides,
    isSaving,
    existingImages,
    pendingImages,
    setPendingImages, // 🎯 注入 setPendingImages 讓媒體櫃可以改檔名
    isLibraryLoaded,
    loadExistingImages,
    addPendingFiles,
    saveModuleChanges
  } = useAdminModule({
    moduleType: "carousel",
    fileName: "carousel.json",
    sanitizeFn: sanitizeAndSyncCarousel,
    extractImagesFn
  });

  const mockLibraryData = useMemo(() => {
    if (!slides) return { categories: {}, works: [] };
    return {
      categories: {
        carousel: { zh: "首頁大輪播相片群", en: "Carousel Gallery", ja: "スライド画像群" }
      },
      works: [
        {
          category: "carousel",
          images: existingImages 
        }
      ]
    };
  }, [slides, existingImages]);

  const mockCategoryOptions = useMemo(() => [{ id: "carousel", label: "首頁大輪播相片群" }], []);

  const startResize = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  useEffect(() => {
    if (!isResizing) return;
    const doResize = (e) => { if (e.clientX > 280 && e.clientX < 600) setLeftPanelWidth(e.clientX); };
    const stopResize = () => setIsResizing(false);
    window.addEventListener("mousemove", doResize); window.addEventListener("mouseup", stopResize);
    return () => { window.removeEventListener("mousemove", doResize); window.removeEventListener("mouseup", stopResize); };
  }, [isResizing]);

  if (!slides) {
    return <div className="p-8 text-center text-xs text-gray-400 font-mono tracking-wider animate-pulse">撈取首頁輪播核心 JSON 中...</div>;
  }

  const handleSave = () => saveModuleChanges(slides, true);
  const handleSaveNoDeploy = () => saveModuleChanges(slides, false);
  const handleCopyJSON = async () => { await navigator.clipboard.writeText(JSON.stringify(slides, null, 2)); alert("輪播 JSON 已成功複製至剪貼簿！"); };
  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(slides, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "carousel.json"; a.click(); URL.revokeObjectURL(url);
  };
  const handleImportJSON = async (file) => {
    try {
      const text = await file.text(); const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("無效的輪播結構，最外層必須為陣列。");
      const cleanData = sanitizeAndSyncCarousel(parsed);
      setSlides(cleanData);
      if (cleanData.length > 0) setActiveIndex(0);
    } catch (e) { alert(`匯入失敗: ${e.message}`); }
  };

  // ---------- 修正後的關鍵新增/綁定函數 ----------
  // 🎯 統一改為只收一個變數 imgName，不管是建立新輪播，還是替換現有圖片都安全
  const addOrUpdateSlideFromLibrary = (imgName) => {
    setSlides(prev => {
      // 如果當前有選中的輪播卡片，且該卡片原本沒圖片，或是點擊「從圖庫加入」想換圖
      if (activeIndex !== null && prev[activeIndex]) {
        const copy = [...prev];
        copy[activeIndex] = { ...copy[activeIndex], image: imgName };
        return copy;
      } else {
        // 如果沒有選中任何卡片，或者想直接「追加」新輪播
        const newSlide = { image: imgName, title: emptyI18n(), desc: emptyI18n() };
        const nextSlides = [...prev, newSlide];
        setActiveIndex(nextSlides.length - 1);
        return nextSlides;
      }
    });
  };

  const removeSlide = (idx) => {
    if (!confirm("確定要將這張圖片從首頁輪播隊列中移除嗎？")) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setActiveIndex(null);
  };

  const updateSlideField = (slideIdx, section, lang, value) => {
    setSlides(prev => {
      const copy = [...prev];
      copy[slideIdx] = {
        ...copy[slideIdx],
        [section]: { ...copy[slideIdx][section], [lang]: value }
      };
      return copy;
    });
  };

  const handleWorkDropZone = (e, slideIdx) => {
    e.preventDefault();
    const imgName = e.dataTransfer.getData("text/plain");
    if (imgName) {
      setSlides(prev => {
        const copy = [...prev];
        copy[slideIdx] = { ...copy[slideIdx], image: imgName };
        return copy;
      });
    }
  };

  const handleDragStart = (idx) => { draggingIndexRef.current = idx; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (targetIdx) => {
    const draggedIdx = draggingIndexRef.current;
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    setSlides(prev => {
      const next = [...prev]; const [draggedItem] = next.splice(draggedIdx, 1);
      next.splice(targetIdx, 0, draggedItem); return next;
    });
    setActiveIndex(targetIdx);
    draggingIndexRef.current = null;
  };

  const handleDropFiles = (files, overrideIdx = null) => {
    const targetIdx = overrideIdx !== null ? overrideIdx : activeIndex;
    addPendingFiles(files, "carousel");
    if (targetIdx !== null && files.length > 0) {
      setSlides(prev => {
        const copy = [...prev];
        copy[targetIdx] = { ...copy[targetIdx], image: files[0].name };
        return copy;
      });
    }
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col">
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0 select-none">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Carousel 輪播圖與多語系控制面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">Mode: {isCloud ? "☁️ Cloudflare R2 Sync" : "💻 Local File Export"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition" onClick={handleCopyJSON}>複製 JSON</button>
          {isCloud ? (
            <>
              <button className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-medium disabled:opacity-50" onClick={handleSaveNoDeploy} disabled={isSaving}>💾 僅儲存</button>
              <button className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-medium disabled:opacity-50 col-span-2 sm:col-span-1" onClick={handleSave} disabled={isSaving}>🚀 儲存並發布網站</button>
            </>
          ) : <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium" onClick={handleDownloadJSON}>📥 下載 JSON</button>}
          <label className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportJSON(e.target.files[0])} />
          </label>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 relative">
        <div style={{ width: `${leftPanelWidth}px` }} className="hidden lg:flex bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex-col shrink-0 overflow-hidden h-[820px]">
          <MediaLibrary
            data={mockLibraryData}
            categoryOptions={mockCategoryOptions}
            activeMediaGroup={activeMediaGroup}
            setActiveMediaGroup={setActiveMediaGroup}
            isLibraryLoaded={isLibraryLoaded}
            loadExistingImages={loadExistingImages}
            pendingImages={pendingImages}
            setPendingImages={setPendingImages} // 🎯 傳入控制權
            activeWorkIndex={activeIndex}
            attachImageToWork={addOrUpdateSlideFromLibrary} // 🎯 綁定修正後的函數
            setIsMobileMediaOpen={setIsMobileMediaOpen}
            addPendingFiles={(files) => addPendingFiles(files, "carousel")}
            getImageSrc={getImageSrc}
            isClickScrollingRef={isClickScrollingRef}
            type="carousel" 
          />
        </div>

        <div onMouseDown={startResize} className="hidden lg:block w-1.5 hover:w-2 bg-transparent hover:bg-gray-300 cursor-col-resize transition shrink-0 self-stretch rounded-full" title="左右拖曳調整管理面板比例" />

        <div className="flex-1 space-y-4 lg:h-[820px] lg:overflow-y-auto lg:pr-1 select-text">
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 select-none">
              <h3 className="text-sm font-bold text-gray-800">② 輪播隊列管理（滑鼠拖曳可調整順序）</h3>
              {/* 🎯 貼心設計：讓使用者在沒選中卡片時也能一鍵新增全新輪播空位 */}
              <button type="button" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition" onClick={() => { setActiveIndex(null); alert("請從左側媒體櫃點擊圖片，將直接建立新的輪播項目！"); }}>＋ 新增全新輪播項目</button>
            </div>
            
            {slides.length === 0 ? (
              <div className="text-center p-12 border border-gray-100 border-dashed bg-gray-50 rounded-2xl text-gray-400 text-sm italic select-none">目前首頁輪播清單為空。</div>
            ) : (
              <div className="space-y-4">
                {slides.map((slide, idx) => {
                  const isActive = activeIndex === idx;
                  const imgBlob = pendingImages.find(p => p.name === slide.image)?.url;
                  const finalSrc = getImageSrc({ type: "carousel", fileName: slide.image, blobUrl: imgBlob });

                  return (
                    <div 
                      key={`${slide.image}-${idx}`} draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)} onClick={() => setActiveIndex(idx)}
                      onDragLeave={e => e.preventDefault()}
                      onDropCapture={e => handleWorkDropZone(e, idx)} 
                      className={classNames("border p-4 transition duration-200 rounded-2xl flex flex-col gap-4 relative", isActive ? "bg-gray-50/50 border-black ring-1 ring-black/5" : "bg-white border-gray-100 hover:border-gray-300 cursor-pointer")}
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 truncate pointer-events-none select-none">
                          <span className="text-gray-300 font-bold text-base shrink-0 px-1">☰</span>
                          <img src={finalSrc} className="w-24 h-14 rounded-lg border border-gray-100 object-cover shadow-xs shrink-0" alt="" />
                          <div className="truncate">
                            <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-medium tracking-wide">Slide {idx + 1}</span>
                            <div className="text-xs font-mono text-gray-500 mt-1.5 truncate flex items-center gap-1.5">
                              {imgBlob && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.2 rounded-full font-sans">待上傳</span>}
                              {slide.image || <span className="text-red-400 italic">尚未選擇相片</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button type="button" className="text-xs bg-black text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-800 transition font-medium" onClick={(e) => {
                            e.stopPropagation(); setActiveIndex(idx); if (!isLibraryLoaded) loadExistingImages(); setIsMobileMediaOpen(true);
                          }}>＋ 更換相片</button>
                          
                          <label className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full font-medium cursor-pointer text-center hover:bg-gray-50">
                            📁 本地上傳 <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleDropFiles(e.target.files, idx)} />
                          </label>

                          <button type="button" className="text-xs text-red-500 border border-red-100 px-3 py-1.5 rounded-full bg-red-50/50 hover:bg-red-50 font-medium" onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}>移除</button>
                        </div>
                      </div>

                      {isActive && (
                        <div className="pt-4 border-t border-gray-100 space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                          {[
                            { key: "zh", label: "繁體中文 (Traditional Chinese)" },
                            { key: "ja", label: "日本語 (Japanese)" },
                            { key: "en", label: "英語 (English)" }
                          ].map((l) => (
                            <div key={l.key} className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-3 shadow-xs">
                              <div className="flex items-center gap-2 select-none">
                                <span className="text-[9px] bg-gray-900 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">{l.key}</span>
                                <span className="text-xs text-gray-700 font-bold">{l.label}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider select-none">輪播大標題 (Title)</span>
                                  <input type="text" className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition" value={slide.title?.[l.key] || ""} onChange={e => updateSlideField(idx, "title", l.key, e.target.value)} placeholder="展演標題..." />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider select-none">副標說明內文 (Description)</span>
                                  <textarea className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition h-16 resize-y leading-relaxed" value={slide.desc?.[l.key] || ""} onChange={e => updateSlideField(idx, "desc", l.key, e.target.value)} placeholder="影像敘述或理念說明..." />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobileMediaOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" onClick={() => setIsMobileMediaOpen(false)}>
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[32px] p-5 flex flex-col shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0 select-none">
              <div>
                <h4 className="font-bold text-gray-900 text-base">🔍 從媒體圖庫加入相片</h4>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">點擊任何相片，即可立刻將其綁定、附加至當前輪播卡片中</p>
              </div>
              <button type="button" className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm font-bold grid place-items-center transition" onClick={() => setIsMobileMediaOpen(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MediaLibrary
                data={mockLibraryData}
                categoryOptions={mockCategoryOptions}
                activeMediaGroup={activeMediaGroup}
                setActiveMediaGroup={setActiveMediaGroup}
                isLibraryLoaded={isLibraryLoaded}
                loadExistingImages={loadExistingImages}
                pendingImages={pendingImages}
                setPendingImages={setPendingImages} // 🎯 行動端同步注入
                activeWorkIndex={activeIndex}
                attachImageToWork={(name) => {
                  addOrUpdateSlideFromLibrary(name);
                  setIsMobileMediaOpen(false);
                }}
                setIsMobileMediaOpen={setIsMobileMediaOpen}
                addPendingFiles={(files) => addPendingFiles(files, "carousel")}
                getImageSrc={getImageSrc}
                isClickScrollingRef={isClickScrollingRef}
                type="carousel"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}