/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { useAdminModule, getImageSrc } from "../_hooks/useAdminModule"; 
import MediaLibrary from "./MediaLibrary"; 

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function AboutBuilder({ isCloud }) {
  const draggingIndexRef = useRef(null);
  
  // 狀態管理：目前選中的語系分頁、左側寬度等
  const [activeLangTab, setActiveLangTab] = useState("zh"); 
  const [activeMediaGroup, setActiveMediaGroup] = useState("all"); 
  const [isMobileMediaOpen, setIsMobileMediaOpen] = useState(false); 
  const [leftPanelWidth, setLeftPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const isClickScrollingRef = useRef(false);

  // 🎯 1. 告訴 Hook 如何從 about.json 提取所有用到的圖片名稱
  const extractImagesFn = useCallback((aboutData) => {
    if (!aboutData || !Array.isArray(aboutData.bannerImages)) return [];
    return aboutData.bannerImages;
  }, []);

  // 🎯 2. 核心：防呆清洗，確保資料結構跟 about.json 完全一致
  const sanitizeAndSyncAbout = useCallback((cloudData) => {
    const defaultData = {
      bannerImages: [],
      en: { title: "", content: "" },
      ja: { title: "", content: "" },
      zh: { title: "", content: "" }
    };

    if (!cloudData || typeof cloudData !== "object") return defaultData;

    return {
      bannerImages: Array.isArray(cloudData.bannerImages) ? cloudData.bannerImages : [],
      en: {
        title: cloudData.en?.title || "",
        content: cloudData.en?.content || ""
      },
      ja: {
        title: cloudData.ja?.title || "",
        content: cloudData.ja?.content || ""
      },
      zh: {
        title: cloudData.zh?.title || "",
        content: cloudData.zh?.content || ""
      }
    };
  }, []);

  // 呼叫你的核心自訂 Hook
  const {
    jsonData: aboutData,
    setJsonData: setAboutData,
    isSaving,
    existingImages,
    pendingImages,
    setPendingImages,
    isLibraryLoaded,
    loadExistingImages,
    addPendingFiles,
    saveModuleChanges
  } = useAdminModule({
    moduleType: "about",
    fileName: "about.json",
    sanitizeFn: sanitizeAndSyncAbout,
    extractImagesFn
  });

  // 模擬媒體櫃需要的分組結構
  const mockLibraryData = useMemo(() => {
    if (!aboutData) return { categories: {}, works: [] };
    return {
      categories: {
        about: { zh: "關於我輪播相片群", en: "About Banner Gallery", ja: "自己紹介画像群" }
      },
      works: [
        {
          category: "about",
          images: existingImages 
        }
      ]
    };
  }, [aboutData, existingImages]);

  const mockCategoryOptions = useMemo(() => [{ id: "about", label: "關於我輪播相片群" }], []);

  // 左右拖曳調整面板寬度
  const startResize = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  useEffect(() => {
    if (!isResizing) return;
    const doResize = (e) => { if (e.clientX > 280 && e.clientX < 600) setLeftPanelWidth(e.clientX); };
    const stopResize = () => setIsResizing(false);
    window.addEventListener("mousemove", doResize); window.addEventListener("mouseup", stopResize);
    return () => { window.removeEventListener("mousemove", doResize); window.removeEventListener("mouseup", stopResize); };
  }, [isResizing]);

  if (!aboutData) {
    return <div className="p-8 text-center text-xs text-gray-400 font-mono tracking-wider animate-pulse">撈取關於我核心 JSON 中...</div>;
  }

  // 儲存與匯出控制
  const handleSave = () => saveModuleChanges(aboutData, true);
  const handleSaveNoDeploy = () => saveModuleChanges(aboutData, false);
  const handleCopyJSON = async () => { await navigator.clipboard.writeText(JSON.stringify(aboutData, null, 2)); alert("關於我 JSON 已成功複製至剪貼簿！"); };
  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(aboutData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = "about.json"; a.click(); URL.revokeObjectURL(url);
  };
  const handleImportJSON = async (file) => {
    try {
      const text = await file.text(); const parsed = JSON.parse(text);
      const cleanData = sanitizeAndSyncAbout(parsed);
      setAboutData(cleanData);
    } catch (e) { alert(`匯入失敗: ${e.message}`); }
  };

  // 🎯 媒體櫃連動：點選媒體櫃照片時，追加進 bannerImages 佇列中
  const addBannerImageFromLibrary = (imgName) => {
    setAboutData(prev => ({
      ...prev,
      bannerImages: [...prev.bannerImages, imgName]
    }));
  };

  const removeBannerImage = (idx) => {
    if (!confirm("確定要將這張圖片從橫幅輪播中移除嗎？")) return;
    setAboutData(prev => ({
      ...prev,
      bannerImages: prev.bannerImages.filter((_, i) => i !== idx)
    }));
  };

  // 🎯 欄位更新：更新指定語系的 title 或 content
  const updateAboutField = (lang, field, value) => {
    setAboutData(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
    }));
  };

  // 拖曳排序 banner 圖片邏輯
  const handleDragStart = (idx) => { draggingIndexRef.current = idx; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (targetIdx) => {
    const draggedIdx = draggingIndexRef.current;
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    setAboutData(prev => {
      const nextImages = [...prev.bannerImages];
      const [draggedItem] = nextImages.splice(draggedIdx, 1);
      nextImages.splice(targetIdx, 0, draggedItem);
      return { ...prev, bannerImages: nextImages };
    });
    draggingIndexRef.current = null;
  };

  // 本地上傳
  const handleDropFiles = (files) => {
    addPendingFiles(files, "about");
    const fileNames = Array.from(files).map(f => f.name);
    setAboutData(prev => ({
      ...prev,
      bannerImages: [...prev.bannerImages, ...fileNames]
    }));
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col">
      {/* 頁首控制列 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0 select-none">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">About Me 關於我多語系與橫幅控制面板</h2>
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

      {/* 主要區塊 */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 relative">
        {/* 左側媒體庫面板 */}
        <div style={{ width: `${leftPanelWidth}px` }} className="hidden lg:flex bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex-col shrink-0 overflow-hidden h-[820px]">
          <MediaLibrary
            data={mockLibraryData}
            categoryOptions={mockCategoryOptions}
            activeMediaGroup={activeMediaGroup}
            setActiveMediaGroup={setActiveMediaGroup}
            isLibraryLoaded={isLibraryLoaded}
            loadExistingImages={loadExistingImages}
            pendingImages={pendingImages}
            setPendingImages={setPendingImages}
            activeWorkIndex={0}
            attachImageToWork={addBannerImageFromLibrary} 
            setIsMobileMediaOpen={setIsMobileMediaOpen}
            addPendingFiles={(files) => addPendingFiles(files, "about")}
            getImageSrc={getImageSrc}
            isClickScrollingRef={isClickScrollingRef}
            type="about" 
          />
        </div>

        {/* 寬度調整桿 */}
        <div onMouseDown={startResize} className="hidden lg:block w-1.5 hover:w-2 bg-transparent hover:bg-gray-300 cursor-col-resize transition shrink-0 self-stretch rounded-full" title="左右拖曳調整管理面板比例" />

        {/* 右側表單工作區 */}
        <div className="flex-1 space-y-6 lg:h-[820px] lg:overflow-y-auto lg:pr-1 select-text">
          
          {/* 區塊一：Banner 輪播圖管理（同 Carousel 邏輯） */}
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 select-none">
              <h3 className="text-sm font-bold text-gray-800">① About 橫幅輪播管理（滑鼠拖曳可調整順序）</h3>
              <button type="button" className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full hover:bg-gray-200 transition" onClick={() => { if (!isLibraryLoaded) loadExistingImages(); setIsMobileMediaOpen(true); }}>＋ 從圖庫挑選加入</button>
            </div>
            
            {aboutData.bannerImages.length === 0 ? (
              <div className="text-center p-12 border border-gray-100 border-dashed bg-gray-50 rounded-2xl text-gray-400 text-sm italic select-none">目前橫幅輪播沒有任何照片，請由左側或點擊右上角加入。</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aboutData.bannerImages.map((imgName, idx) => {
                  const imgBlob = pendingImages.find(p => p.name === imgName)?.url;
                  const finalSrc = getImageSrc({ type: "about", fileName: imgName, blobUrl: imgBlob });

                  return (
                    <div 
                      key={`${imgName}-${idx}`} draggable onDragStart={() => handleDragStart(idx)} onDragOver={handleDragOver} onDrop={() => handleDrop(idx)}
                      className="border border-gray-100 bg-white p-3 rounded-2xl flex items-center gap-3 relative hover:border-gray-300 cursor-grab active:cursor-grabbing transition"
                    >
                      <span className="text-gray-300 font-bold text-sm shrink-0 select-none">☰</span>
                      <img src={finalSrc} className="w-20 h-14 rounded-lg border border-gray-100 object-cover shrink-0 shadow-xs" alt="" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">位置 {idx + 1}</span>
                        <div className="text-xs font-mono text-gray-500 mt-1 truncate flex items-center gap-1">
                          {imgBlob && <span className="text-[8px] bg-amber-500 text-white px-1 rounded-sm">待上傳</span>}
                          {imgName}
                        </div>
                      </div>
                      <button type="button" className="text-xs text-red-500 hover:bg-red-50 p-1 px-2 rounded-md transition shrink-0" onClick={(e) => { e.stopPropagation(); removeBannerImage(idx); }}>移除</button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-3 flex justify-end">
              <label className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-full font-medium cursor-pointer hover:bg-gray-50 transition">
                📁 批次本地上傳圖片 <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleDropFiles(e.target.files)} />
              </label>
            </div>
          </div>

          {/* 區塊二：多語系個人簡介控制（Tab 頁籤切換） */}
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-50 select-none">
              <h3 className="text-sm font-bold text-gray-800">② 個人簡介內文編輯 (Multi-language Content)</h3>
              
              {/* 語系切換 Tab */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-full">
                {[
                  { key: "zh", label: "繁中" },
                  { key: "ja", label: "日本語" },
                  { key: "en", label: "English" }
                ].map(t => (
                  <button 
                    key={t.key} type="button" 
                    className={classNames("px-3 py-1 rounded-full text-xs font-medium transition", activeLangTab === t.key ? "bg-white text-black shadow-xs font-bold" : "text-gray-500 hover:text-gray-900")}
                    onClick={() => setActiveLangTab(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 根據選中語系呈現對應表單 */}
            {["zh", "ja", "en"].map((lang) => {
              if (activeLangTab !== lang) return null;
              return (
                <div key={lang} className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider select-none">主標題 (Title)</label>
                    <input 
                      type="text" 
                      className="w-full border border-gray-200 rounded-xl text-sm p-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition font-medium" 
                      value={aboutData[lang]?.title || ""} 
                      onChange={e => updateAboutField(lang, "title", e.target.value)} 
                      placeholder="請輸入關於我展演主標..." 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider select-none">個人簡介內文 (Biography Content)</label>
                    <textarea 
                      className="w-full border border-gray-200 rounded-xl text-sm p-3 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition h-64 resize-y leading-relaxed font-sans" 
                      value={aboutData[lang]?.content || ""} 
                      onChange={e => updateAboutField(lang, "content", e.target.value)} 
                      placeholder="請輸入個人故事、經歷與創作理念說明..." 
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* 行動端彈出式媒體櫃 */}
      {isMobileMediaOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" onClick={() => setIsMobileMediaOpen(false)}>
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[32px] p-5 flex flex-col shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0 select-none">
              <div>
                <h4 className="font-bold text-gray-900 text-base">🔍 從媒體圖庫加入相片</h4>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">點擊相片即可立刻追加至橫幅中</p>
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
                setPendingImages={setPendingImages}
                activeWorkIndex={0}
                attachImageToWork={(name) => {
                  addBannerImageFromLibrary(name);
                  setIsMobileMediaOpen(false);
                }}
                setIsMobileMediaOpen={setIsMobileMediaOpen}
                addPendingFiles={(files) => addPendingFiles(files, "about")}
                getImageSrc={getImageSrc}
                isClickScrollingRef={isClickScrollingRef}
                type="about"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}