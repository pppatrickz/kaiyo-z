/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useAdminModule, getImageSrc } from "../_hooks/useAdminModule"; // 🎯 注入全能核心 Hook
import MediaLibrary from "./MediaLibrary"; // 🎯 引入你那份完美的共用媒體櫃組件

const emptyI18n = () => ({ en: "", ja: "", zh: "" });

function extractISODatePrefix(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const cleaned = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  const match = cleaned.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (match) {
    const [_, y, m, d] = match;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function NewsBuilder({ isCloud }) {
  const fileInputRef = useRef(null);
  const draggingImageIndexRef = useRef(null);
  
  // 🎯 UI 與面板控制狀態
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeMediaGroup, setActiveMediaGroup] = useState("all"); 
  const [isMobileMediaOpen, setIsMobileMediaOpen] = useState(false); 
  const [leftPanelWidth, setLeftPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const isClickScrollingRef = useRef(false); 

  // 🎯 1. 消息專屬：從最新消息 JSON 中全面抽取所有圖片檔名的規則
  const extractImagesFn = useCallback((newsArray) => {
    if (!Array.isArray(newsArray)) return [];
    const allImgs = new Set();
    newsArray.forEach(n => {
      if (n.image) allImgs.add(n.image);
      if (Array.isArray(n.images)) {
        n.images.forEach(img => img && allImgs.add(img));
      }
    });
    return Array.from(allImgs);
  }, []);

  // 🎯 2. 消息專屬：智慧網址 ID 生成器 (防止重渲染位址改變)
  const generateSmartNewsId = useCallback((newsArray, targetNewsId, dateString) => {
    const baseDatePrefix = extractISODatePrefix(dateString);
    const otherNews = newsArray.filter(n => n.id !== targetNewsId);
    let counter = 1;
    let finalId = `${baseDatePrefix}-${counter}`;
    while (otherNews.some(n => String(n.id) === finalId)) {
      counter++;
      finalId = `${baseDatePrefix}-${counter}`;
    }
    return finalId;
  }, []);

  // 🎯 3. 消息專屬：資料結構清洗修復函數
  const sanitizeAndSyncSlugs = useCallback((rawArray) => {
    if (!Array.isArray(rawArray)) return [];
    const processedNews = [];
    rawArray.forEach((n) => {
      const item = { ...n };
      item.id = item.id || item.slug || `temp-${Date.now()}`;
      if (item.slug) delete item.slug; 
      item.image = item.image || "";
      item.alt = item.alt || "";
      item.date = item.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); 
      item.title = item.title || emptyI18n();
      item.content = item.content || emptyI18n();
      item.images = Array.isArray(item.images) ? item.images : [];
      
      if (item.id.startsWith("temp-") || (item.id.includes("-") && item.id.length > 20)) {
        item.id = generateSmartNewsId(processedNews, item.id, item.date);
      }
       processedNews.push(item); // 對齊您的原生變數推入
    });
    return processedNews;
  }, [generateSmartNewsId]);

  // 🎯 4. 精準對接智慧全能 Hook，全面交給大腦打理
  const {
    jsonData: news,
    setJsonData: setNews,
    isSaving,
    existingImages,
    pendingImages,
    isLibraryLoaded,
    loadExistingImages,
    addPendingFiles,
    saveModuleChanges
  } = useAdminModule({
    moduleType: "news",
    fileName: "news.json",
    sanitizeFn: sanitizeAndSyncSlugs,
    extractImagesFn
  });

  // 🎯 5. 新聞專用的虛擬媒體櫃資料包：大挪移到提前 return 之前，徹底擊碎 Hooks 呼叫順序報錯的 Bug！
  const mockLibraryData = useMemo(() => {
    if (!news) return { categories: {}, works: [] };
    return {
      categories: {
        news: { zh: "公告消息相片群", en: "News Gallery", ja: "お知らせ画像" }
      },
      works: [
        {
          category: "news",
          images: existingImages // 綁定現有抽取出的圖片檔案群
        }
      ]
    };
  }, [news, existingImages]);

  // 🎯 6. 虛擬標籤選項定義
  const mockCategoryOptions = useMemo(() => [{ id: "news", label: "公告消息相片群" }], []);

  // 🎯 7. 面板調寬事件微調
  const startResize = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  useEffect(() => {
    if (!isResizing) return;
    const doResize = (e) => { if (e.clientX > 280 && e.clientX < 600) setLeftPanelWidth(e.clientX); };
    const stopResize = () => setIsResizing(false);
    window.addEventListener("mousemove", doResize); window.addEventListener("mouseup", stopResize);
    return () => { window.removeEventListener("mousemove", doResize); window.removeEventListener("mouseup", stopResize); };
  }, [isResizing]);


  // 🎯 🌟 【真·黃金防禦截斷線】：所有 Hooks 正下方的唯一絕對防線！
  if (!news) {
    return <div className="p-8 text-center text-xs text-gray-400 font-mono tracking-wider animate-pulse">撈取最新消息核心 JSON 中...</div>;
  }


  // 整理要組裝輸出的標準 JSON 資料欄位
  const assembleOutput = () => {
    return news.map((n) => ({
      id: n.id, 
      image: n.image || "",
      alt: n.alt || "",
      date: n.date, 
      title: { en: n.title?.en || "", ja: n.title?.ja || "", zh: n.title?.zh || "" },
      content: { en: n.content?.en || "", ja: n.content?.ja || "", zh: n.content?.zh || "" },
      images: Array.isArray(n.images) ? n.images : [],
    }));
  };

  // ----- 快捷按鈕對接處理 -----
  const handleSave = () => saveModuleChanges(assembleOutput(), true);
  const handleSaveNoDeploy = () => saveModuleChanges(assembleOutput(), false);
  const handleCopyJSON = async () => { await navigator.clipboard.writeText(JSON.stringify(assembleOutput(), null, 2)); alert("最新 News JSON 已成功複製至剪貼簿！"); };
  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(assembleOutput(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "news.json"; a.click(); URL.revokeObjectURL(url);
  };
  const handleImportJSON = (file) => {
    try {
      const text = file.text().then(txt => {
        const parsed = JSON.parse(txt);
        if (!Array.isArray(parsed)) throw new Error("無效的消息結構，最外層必須為陣列。");
        setNews(sanitizeAndSyncSlugs(parsed)); setActiveIndex(null);
      });
    } catch (e) { alert(`匯入失敗: ${e.message}`); }
  };

  // ----- 快訊公告 CRUD 核心邏輯 -----
  const addNews = () => {
    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const tempId = `temp-${Date.now()}`;
    const item = { id: tempId, image: "", alt: "New Post", date: todayStr, title: emptyI18n(), content: emptyI18n(), images: [] };
    setNews(prev => {
      item.id = generateSmartNewsId(prev, tempId, todayStr);
      const next = [item, ...prev]; 
      setActiveIndex(0);
      return next;
    });
  };

  const removeNews = (idx) => { 
    if (confirm("確定要刪除這則快訊公告嗎？")) { 
      setNews(prev => prev.filter((_, i) => i !== idx)); 
      setActiveIndex(null); 
    } 
  };

  const moveNews = (idx, dir) => {
    setNews(prev => { 
      const ni = idx + dir; if (ni < 0 || ni >= prev.length) return prev; 
      const c = [...prev]; const [it] = c.splice(idx, 1); c.splice(ni, 0, it); return c; 
    });
    setActiveIndex(i => i === null ? i : i + dir);
  };

  const updateNews = (idx, patch) => { 
    setNews(prev => { 
      const c = [...prev]; const target = { ...c[idx], ...patch };
      if (patch.date !== undefined) target.id = generateSmartNewsId(c, target.id, patch.date);
      c[idx] = target; return c; 
    }); 
  };

  const updateI18n = (idx, field, loc, val) => { 
    setNews(prev => { const c = [...prev]; c[idx][field] = { ...c[idx][field], [loc]: val }; return c; }); 
  };

  // ----- 智慧媒體櫃功能分流 -----
  const attachImageToItem = (idx, name) => { 
    setNews(prev => { 
      const c = [...prev]; const currentImages = c[idx].images || [];
      c[idx].images = Array.from(new Set([...currentImages, name])); 
      if (!c[idx].image) c[idx].image = name; return c; 
    }); 
  };

  const removeImageFromItem = (idx, name) => { 
    setNews(p => { 
      const c = [...p]; c[idx].images = (c[idx].images || []).filter(n => n !== name); 
      if (c[idx].image === name) c[idx].image = c[idx].images[0] || ""; return c; 
    }); 
  };

  const moveImageWithinItem = (idx, imgIdx, dir) => {
    setNews(p => {
      const c = [...p]; const imgs = [...(c[idx].images || [])]; const ni = imgIdx + dir;
      if (ni < 0 || ni >= imgs.length) return p;
      const [it] = imgs.splice(imgIdx, 1); imgs.splice(ni, 0, it); c[idx].images = imgs; return c;
    });
  };

  const handleImageDragStart = (imgIdx) => { draggingImageIndexRef.current = imgIdx; };
  const handleImageDragOver = (e) => { e.preventDefault(); };
  const handleImageDrop = (newsIdx, targetImgIdx) => {
    const draggedIdx = draggingImageIndexRef.current; if (draggedIdx === null || draggedIdx === targetImgIdx) return;
    setNews(p => {
      const c = [...p]; const imgs = [...(c[newsIdx].images || [])];
      const [draggedItem] = imgs.splice(draggedIdx, 1); imgs.splice(targetImgIdx, 0, draggedItem);
      c[newsIdx].images = imgs; return c;
    });
    draggingImageIndexRef.current = null;
  };

  const handleDropFiles = (files, overrideNewsIdx = null) => {
    const targetIdx = overrideNewsIdx !== null ? overrideNewsIdx : activeIndex;
    addPendingFiles(files, "news");
    if (targetIdx !== null && files.length > 0) {
      Array.from(files).forEach(f => attachImageToItem(targetIdx, f.name));
    }
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col">
      
      {/* 頂部控制列 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0 select-none">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">📰 最新消息管理面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">Mode: {isCloud ? "☁️ Cloudflare R2 Sync" : "💻 Local File Export"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <button className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium shadow-sm hover:bg-gray-800 transition" onClick={addNews}>+ 新增快訊</button>
          <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition" onClick={handleCopyJSON}>複製 JSON</button>
          {isCloud ? (
            <>
              <button className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-medium disabled:opacity-50" onClick={handleSaveNoDeploy} disabled={isSaving}>💾 僅儲存</button>
              <button className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-medium disabled:opacity-50 col-span-2 sm:col-span-1" onClick={handleSave} disabled={isSaving}>
                🚀 儲存並發布網站
              </button>
            </>
          ) : <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium" onClick={handleDownloadJSON}>📥 下載 JSON</button>}
          <label className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && handleImportJSON(e.target.files[0])} />
          </label>
        </div>
      </header>

      {/* 旗艦主版面雙配欄 (與 Works 佈局完全拉平對齊) */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 relative">
        
        {/* 💻 1. 桌機端側邊欄：完美嵌入您的共用 MediaLibrary 元件 */}
        <div 
          style={{ width: `${leftPanelWidth}px` }} 
          className="hidden lg:flex bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex-col shrink-0 overflow-hidden h-[820px]"
        >
          <MediaLibrary
            data={mockLibraryData}
            categoryOptions={mockCategoryOptions}
            activeMediaGroup={activeMediaGroup}
            setActiveMediaGroup={setActiveMediaGroup}
            isLibraryLoaded={isLibraryLoaded}
            loadExistingImages={loadExistingImages}
            pendingImages={pendingImages}
            activeWorkIndex={activeIndex}
            attachImageToWork={attachImageToItem}
            setIsMobileMediaOpen={setIsMobileMediaOpen}
            addPendingFiles={(files) => addPendingFiles(files, "news")}
            getImageSrc={getImageSrc}
            isClickScrollingRef={isClickScrollingRef}
            type={"news"}
          />
        </div>

        {/* 左右拖曳分割軌道 (桌機專屬) */}
        <div onMouseDown={startResize} className="hidden lg:block w-1.5 hover:w-2 bg-transparent hover:bg-gray-300 cursor-col-resize transition shrink-0 self-stretch rounded-full" title="左右拖曳調整管理面板比例" />

        {/* 2. 右側主要消息編輯表單 */}
        <div className="flex-1 space-y-4 lg:h-[820px] lg:overflow-y-auto lg:pr-1 select-text">
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            <span className="text-sm font-bold text-gray-800 block border-b border-gray-100 pb-3 mb-4 select-none">公告快訊總計清冊 ({news.length})</span>
            
            <div className="space-y-4">
              {news.map((item, i) => {
                const isActive = activeIndex === i;
                return (
                  <div key={item.id} className={classNames("p-4 md:p-5 flex flex-col sm:flex-row gap-5 transition duration-200 border relative group rounded-2xl", isActive ? "bg-gray-50/50 border-black ring-1 ring-black/5" : "bg-white border-gray-100 hover:border-gray-300")} onClick={() => setActiveIndex(i)}>
                    
                    <div className="w-full sm:w-20 shrink-0 flex sm:flex-col justify-between items-center sm:justify-start gap-3 select-none">
                      <div className="w-16 h-16 sm:w-full aspect-square bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative shadow-inner shrink-0">
                        {item.image ? (
                          <img src={getImageSrc({ type: "news", fileName: item.image, blobUrl: pendingImages.find(p => p.name === item.image)?.url })} className="w-full h-full object-cover" alt="" />
                        ) : <div className="text-[10px] grid place-items-center h-full text-gray-400 font-medium">無封面</div>}
                      </div>
                      <div className="flex flex-row gap-1 text-center justify-center">
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg font-mono font-bold" onClick={e => { e.stopPropagation(); moveNews(i, -1); }}>↑</button>
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg font-mono font-bold" onClick={e => { e.stopPropagation(); moveNews(i, 1); }}>↓</button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">網址唯一識別碼 (ID / Slug)</span>
                          <div className="w-full bg-gray-100 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-gray-800 truncate">🔗 {item.id}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">前台顯示日期 (Date String)</span>
                          <input className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-white focus:outline-none focus:border-black transition" value={item.date || ""} onChange={e => updateNews(i, { date: e.target.value })} placeholder="October 13, 2025" />
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block select-none">圖片無障礙替代文字 (Alt)</span>
                        <input className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-white focus:outline-none focus:border-black transition" value={item.alt || ""} onChange={e => updateNews(i, { alt: e.target.value })} placeholder="2026 創作聯展快訊" />
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5 select-none">📢 公告標題 (Title)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex items-center gap-1.5 border border-gray-200 rounded-xl bg-white px-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase w-4 font-bold text-center select-none">{l}</span>
                              <input className="w-full text-xs py-2 bg-transparent focus:outline-none" value={item.title?.[l] || ""} onChange={e => updateI18n(i, "title", l, e.target.value)} placeholder="請輸入消息標題..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5 select-none">📝 詳細內文內容 (Content)</span>
                        <div className="space-y-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex gap-2 items-start bg-gray-50/50 border border-gray-100 rounded-xl p-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold w-5 text-center mt-2 shrink-0 select-none">{l}</span>
                              <textarea className="w-full text-xs bg-transparent focus:outline-none h-20 resize-y leading-relaxed" value={item.content?.[l] || ""} onChange={e => updateI18n(i, "content", l, e.target.value)} placeholder="最新公告完整內文..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 消息相簿排序隊列（對齊最白話的『從圖庫加入』按鈕字眼） */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
                          <span className="block text-[11px] text-gray-700 font-bold">📸 已綁定消息相簿（支援拖曳調整前後順序）</span>
                          
                          <div className="flex gap-1.5">
                            <button type="button" className="text-[10px] bg-black text-white px-2.5 py-1.5 rounded-lg font-medium shadow-sm hover:bg-gray-800" onClick={() => {
                              setActiveIndex(i); 
                              if (!isLibraryLoaded) loadExistingImages(); 
                              setIsMobileMediaOpen(true); 
                            }}>＋ 從圖庫加入</button>
                            
                            <label className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg font-medium cursor-pointer text-center hover:bg-gray-50">
                              📁 本地上傳 <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleDropFiles(e.target.files, i)} />
                            </label>
                          </div>
                        </div>

                        {item.images && item.images.length ? (
                          <div className="space-y-2">
                            {item.images.map((imgName, imgIdx) => {
                              const imgBlob = pendingImages.find(p => p.name === imgName)?.url;
                              const finalSrc = getImageSrc({ type: "news", fileName: imgName, blobUrl: imgBlob });
                              return (
                                <div key={`${imgName}-${imgIdx}`} draggable onDragStart={() => handleImageDragStart(imgIdx)} onDragOver={handleImageDragOver} onDrop={() => handleImageDrop(i, imgIdx)} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-xl shadow-xs gap-3 cursor-grab active:cursor-grabbing hover:border-black transition">
                                  <div className="flex items-center gap-2 truncate pointer-events-none">
                                    <span className="text-gray-300 font-bold select-none text-xs px-1">☰</span>
                                    <img src={finalSrc} className="w-8 h-8 rounded-lg object-cover border shrink-0" alt="" />
                                    <span className="truncate font-mono text-[11px] text-gray-600">{imgName}</span>
                                    {imgBlob && <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-sans font-medium">待上傳</span>}
                                    {item.image === imgName && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full font-sans font-medium">封面主圖</span>}
                                  </div>
                                  <div className="space-x-1 shrink-0 flex items-center">
                                    <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinItem(i, imgIdx, -1)}>↑</button>
                                    <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinItem(i, imgIdx, 1)}>↓</button>
                                    <button type="button" className={classNames("text-[10px] px-2 py-1 border rounded-lg transition font-medium", item.image === imgName ? "bg-black text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")} onClick={() => updateNews(i, { image: imgName })}>設為封面</button>
                                    <button type="button" className="text-[10px] text-red-500 border border-red-100 px-2 py-1 rounded-lg bg-red-50/50 hover:bg-red-50" onClick={() => removeImageFromItem(i, imgName)}>移除</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="text-[11px] text-gray-400 italic select-none">此則公告目前相簿為空。</p>}
                      </div>
                    </div>
                    
                    <button type="button" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-full h-9 self-end sm:self-start shrink-0 font-medium mt-2 sm:mt-0" onClick={e => { e.stopPropagation(); removeNews(i); }}>刪除消息</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 📱 3. 行動端特化彈出式全螢幕 Modal 抽屜：在新聞後台也能完美喚起！ */}
      {isMobileMediaOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" onClick={() => setIsMobileMediaOpen(false)}>
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[32px] p-5 flex flex-col shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0 select-none">
              <div>
                <h4 className="font-bold text-gray-900 text-base">🔍 從媒體圖庫加入相片</h4>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">點擊任何相片，即可立刻將其綁定、附加至當前公告中</p>
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
                activeWorkIndex={activeIndex}
                attachImageToWork={attachImageToItem}
                setIsMobileMediaOpen={setIsMobileMediaOpen}
                addPendingFiles={(files) => addPendingFiles(files, "news")}
                getImageSrc={getImageSrc}
                isClickScrollingRef={isClickScrollingRef}
                type={"news"}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
} 