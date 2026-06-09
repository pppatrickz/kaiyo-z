/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { slugify } from "@/app/_lib/slugify"; 
import { useAdminModule, getImageSrc } from "../_hooks/useAdminModule";
import MediaLibrary from "./MediaLibrary"; // 👈 引入剛剛切出去的媒體櫃組件

const emptyI18n = () => ({ en: "", ja: "", zh: "" });

function normalizeDateToYMD(x) {
  if (!x) return "";
  const s = String(x).trim();
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function WorksBuilder({ isCloud }) {
  const draggingImageIndexRef = useRef(null);
  const isClickScrollingRef = useRef(false); 

  // 面板主狀態
  const [activeWorkIndex, setActiveWorkIndex] = useState(null);
  const [sortKey, setSortKey] = useState("sequence"); 
  const [sortOrder, setSortOrder] = useState("asc");  
  const [activeTab, setActiveTab] = useState("all");
  
  // 布局與增強功能狀態
  const [leftPanelWidth, setLeftPanelWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [activeMediaGroup, setActiveMediaGroup] = useState("all"); 
  const [isMobileMediaOpen, setIsMobileMediaOpen] = useState(false); 
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false); 

  // 全面抽取所有圖片檔名的規則
  const extractImagesFn = useCallback((json) => {
    if (!json || !Array.isArray(json.works)) return [];
    const imageMap = new Map();
    json.works.forEach(w => {
      if (Array.isArray(w.images)) {
        w.images.forEach(img => {
          if (!img) return;
          if (img.includes("::")) {
            const [originCat, realName] = img.split("::");
            imageMap.set(realName, originCat);
          } else {
            imageMap.set(img, w.category || "uncategorized");
          }
        });
      }
    });
    return Array.from(imageMap.entries()).map(([name, category]) => ({ name, category }));
  }, []);

  const sanitizeAndSyncSlugs = useCallback((currentData) => {
    if (!currentData) return { categories: {}, works: [] };
    const cleanData = { categories: currentData.categories || {}, works: Array.isArray(currentData.works) ? currentData.works : [] };
    const processedWorks = [];
    cleanData.works.forEach((w) => {
      const item = { ...w };
      item.date = normalizeDateToYMD(item.date || item.year || new Date().toISOString().slice(0, 10));
      item.desc = item.desc || emptyI18n();
      item.material = item.material || emptyI18n();
      item.images = Array.isArray(item.images) ? item.images : [];
      processedWorks.push(item);
    });
    cleanData.works = processedWorks;
    return cleanData;
  }, []);

  const { jsonData: data, setJsonData: setData, isSaving, existingImages, pendingImages, isLibraryLoaded, loadExistingImages, addPendingFiles, saveModuleChanges } = useAdminModule({
    moduleType: "works", fileName: "works.json", sanitizeFn: sanitizeAndSyncSlugs, extractImagesFn
  });

  // 智慧網址隨時校正生成器
  const generateSmartSlug = useCallback((worksArray, targetWorkId, currentCategory, currentDate, englishTitle) => {
    const cleanDate = (currentDate || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
    let baseSlug = englishTitle ? slugify(englishTitle.trim().toLowerCase()) : "";
    if (!baseSlug) baseSlug = `${currentCategory || "work"}-${cleanDate}`;
    const otherWorks = worksArray.filter(w => w.id !== targetWorkId);
    if (!otherWorks.some(w => String(w.id) === baseSlug)) return baseSlug;
    let suffixCounter = 1; let finalSlug = `${baseSlug}-${suffixCounter}`;
    while (otherWorks.some(w => String(w.id) === finalSlug)) { suffixCounter++; finalSlug = `${baseSlug}-${suffixCounter}`; }
    return finalSlug;
  }, []);

  // 智慧型跨分類引渡路徑解析器
  const parseImagePath = useCallback((workCategory, imgName, pendingList = []) => {
    const imgBlob = pendingList.find(p => p.name === imgName)?.url;
    if (imgBlob) return imgBlob;
    if (imgName && imgName.includes("::")) {
      const [originCategory, realFileName] = imgName.split("::");
      return getImageSrc({ type: "works", category: originCategory, fileName: realFileName });
    }
    return getImageSrc({ type: "works", category: workCategory, fileName: imgName });
  }, []);

  // 面板調寬事件
  const startResize = useCallback((e) => { e.preventDefault(); setIsResizing(true); }, []);
  useEffect(() => {
    if (!isResizing) return;
    const doResize = (e) => { if (e.clientX > 280 && e.clientX < 600) setLeftPanelWidth(e.clientX); };
    const stopResize = () => setIsResizing(false);
    window.addEventListener("mousemove", doResize); window.addEventListener("mouseup", stopResize);
    return () => { window.removeMouseMoveListener = window.removeEventListener("mousemove", doResize); window.removeEventListener("mouseup", stopResize); };
  }, [isResizing]);

  // 作品列表過濾與排序用
  const filteredWorks = useMemo(() => {
    if (!data || !Array.isArray(data.works)) return [];
    const base = activeTab === "all" ? data.works : data.works.filter(w => w.category === activeTab);
    const arr = [...base];
    if (sortKey !== "sequence") {
      arr.sort((a, b) => {
        if (sortKey === "title") return (a.title?.en || "").toLowerCase().localeCompare((b.title?.en || "").toLowerCase());
        return (a.date || "").localeCompare(b.date || "");
      });
    }
    if (sortOrder === "desc") arr.reverse();
    return arr;
  }, [data, activeTab, sortKey, sortOrder]);

  // 【真·黃金防禦線】
  if (!data || !data.categories) {
    return <div className="p-8 text-center text-xs text-gray-400 font-mono tracking-wider animate-pulse">撈取作品集核心 JSON 中...</div>;
  }

  const categoryIds = Object.keys(data.categories);
  const categoryOptions = categoryIds.map((id) => ({ 
    id, 
    label: data.categories[id]?.zh || data.categories[id]?.en || id 
  }));

  const handleMediaDragStart = (e, imgName, originCat = "") => {
    const targetWork = activeWorkIndex !== null ? data.works[activeWorkIndex] : null;
    let finalPayloadName = imgName;
    if (targetWork && originCat && targetWork.category !== originCat) {
      finalPayloadName = `${originCat}::${imgName}`;
    }
    e.dataTransfer.setData("text/plain", finalPayloadName);
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleWorkDropZone = (e, workIdx) => { e.preventDefault(); const imgName = e.dataTransfer.getData("text/plain"); if (imgName) attachImageToWork(workIdx, imgName); };

  //快捷功能 
  const handleSave = () => saveModuleChanges(data, true);
  const handleSaveNoDeploy = () => saveModuleChanges(data, false);
  const handleCopyJSON = async () => { await navigator.clipboard.writeText(JSON.stringify(data, null, 2)); alert("JSON 已成功複製！"); };
  const handleDownloadJSON = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "works.json"; a.click(); URL.revokeObjectURL(url); };

  // 分類維護
  const addCategory = () => {
    const newId = prompt("請輸入新分類英文鍵值 Key (例如 jewelry):"); if (!newId || data.categories[newId]) return;
    const zhTitle = prompt("請輸入 [中文] 顯示名稱:") || newId; const jaTitle = prompt("請輸入 [日文] 顯示名稱:") || newId; const enTitle = prompt("請輸入 [英文] 顯示名稱:") || newId;
    setData(d => ({ ...d, categories: { ...d.categories, [newId.trim()]: { en: enTitle, ja: jaTitle, zh: zhTitle } } }));
    setActiveTab(newId.trim());
  };

  const removeCategory = (id) => {
    const hasExistingWorks = data.works.some(w => w.category === id);
    if (hasExistingWorks) {
      alert(`⚠️ 拒絕刪除分類！\n原因：目前還有作品屬於 [${data.categories[id]?.zh || id}] 分類。請先清空或轉移這些作品！`);
      return;
    }
    if (!confirm(`確定要將空分類項目 "${id}" 徹底移除嗎？`)) return;
    setData(d => { const copy = { ...d.categories }; delete copy[id]; return { ...d, categories: copy }; });
    if (activeTab === id) setActiveTab("all");
  };

  const updateCategoryI18n = (id, locale, value) => { setData(d => ({ ...d, categories: { ...d.categories, [id]: { ...d.categories[id], [locale]: value } } })); };
  
  // 作品維護 
  const addWork = () => {
    const defaultCat = activeTab !== "all" ? activeTab : (categoryOptions[0]?.id || "uncategorized");
    const todayStr = new Date().toISOString().slice(0, 10); const tempId = `temp-${crypto.randomUUID()}`;
    const newWork = { id: tempId, category: defaultCat, title: emptyI18n(), date: todayStr, showFullDate: false, material: emptyI18n(), desc: emptyI18n(), images: [] };
    setData(d => {
      const arr = [...d.works]; let idx = 0; if (activeTab !== "all") { const f = arr.findIndex(w => w.category === activeTab); idx = f === -1 ? arr.length : f; }
      newWork.id = generateSmartSlug(arr, tempId, defaultCat, todayStr, ""); arr.splice(idx, 0, newWork); return { ...d, works: arr };
    });
    setActiveWorkIndex(0);
  };

  const removeWork = (index) => { if (!confirm("確定要刪除這件作品嗎？")) return; setData(d => ({ ...d, works: d.works.filter((_, i) => i !== index) })); if (activeWorkIndex === index) setActiveWorkIndex(null); };
  const moveWork = (index, dir) => { setData(d => { const arr = [...d.works]; const ni = index + dir; if (ni < 0 || ni >= arr.length) return d; const [item] = arr.splice(index, 1); arr.splice(ni, 0, item); return { ...d, works: arr }; }); setActiveWorkIndex(i => i === null ? i : i + dir); };
  const updateWork = (index, patch) => { setData(d => { const arr = [...d.works]; const target = { ...arr[index], ...patch }; if (patch.category !== undefined || patch.date !== undefined) target.id = generateSmartSlug(arr, target.id, target.category, target.date, target.title?.en); arr[index] = target; return { ...d, works: arr }; }); };
  const updateWorkI18n = (index, field, locale, value) => { setData(d => { const arr = [...d.works]; const updatedI18nObj = { ...arr[index][field], [locale]: value }; const target = { ...arr[index], [field]: updatedI18nObj }; if (field === "title" && locale === "en") target.id = generateSmartSlug(arr, target.id, target.category, target.date, value); arr[index] = target; return { ...d, works: arr }; }); };

  // 相簿圖庫雙向操作
  const handleDropFiles = (files, overrideWorkIdx = null) => {
    const targetIdx = overrideWorkIdx !== null ? overrideWorkIdx : activeWorkIndex;
    const currentCategory = targetIdx !== null ? data.works[targetIdx]?.category : "";
    addPendingFiles(files, currentCategory);
    if (targetIdx !== null && files.length > 0) { Array.from(files).forEach(f => attachImageToWork(targetIdx, f.name)); }
  };

 const attachImageToWork = (idx, name) => {
    // 🛡️ 防呆第一線：確保索引是數字且該作品確實存在
    if (idx === null || typeof idx !== "number") return;

    setData(d => {
      if (!d || !Array.isArray(d.works) || !d.works[idx]) return d; // 🛡️ 安全鎖
      
      const arr = [...d.works];
      arr[idx] = { 
        ...arr[idx], 
        images: Array.from(new Set([...(arr[idx].images || []), name])) 
      };
      return { ...d, works: arr };
    });
  };
   const removeImageFromWork = (idx, name) => { setData(d => { const arr = [...d.works]; arr[idx] = { ...arr[idx], images: (arr[idx].images || []).filter(n => n !== name) }; return { ...d, works: arr }; }); };
  const moveImageWithinWork = (idx, imgIdx, dir) => { setData(d => { const arr = [...d.works]; const imgs = [...(arr[idx].images || [])]; const ni = imgIdx + dir; if (ni < 0 || ni >= imgs.length) return d; const [it] = imgs.splice(imgIdx, 1); imgs.splice(ni, 0, it); arr[idx] = { ...arr[idx], images: imgs }; return { ...d, works: arr }; }); };

  // 打包媒體櫃所需的 Props 
 // 打包媒體櫃所需的 Props 
  const mediaLibraryProps = {
    data,
    categoryOptions,
    activeMediaGroup,
    setActiveMediaGroup,
    isLibraryLoaded,
    loadExistingImages,
    pendingImages,
    activeWorkIndex,
    // 🎯 修正這裡：包裝一層箭頭函式，確保精確傳遞當前的 activeWorkIndex
    attachImageToWork: (name) => {
      if (activeWorkIndex === null) {
        alert("請先在右側點擊選擇一件「作品卡片」，再從圖庫加入圖片！");
        return;
      }
      attachImageToWork(activeWorkIndex, name);
    },
    setIsMobileMediaOpen,
    addPendingFiles,
    getImageSrc,
    isClickScrollingRef,
    type: "works"
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col">
      {/* 頂部 Pill 按鈕 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">📁 作品集管理面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">Mode: {isCloud ? "☁️ R2 Sync" : "💻 Local File Export"}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 select-none">
          <button className={classNames("px-3 py-2 rounded-full text-xs font-medium border transition", isCatManagerOpen ? "bg-gray-200 text-black border-transparent" : "bg-white text-gray-700 border-gray-200")} onClick={() => setIsCatManagerOpen(!isCatManagerOpen)}>
            {isCatManagerOpen ? "✕ 關閉分類大師" : "🏷️ 分類管理大師"}
          </button>
          <button className="px-3 py-2 rounded-full bg-black text-white text-xs font-medium shadow-sm hover:bg-gray-800 transition" onClick={addWork}>+ 新增作品</button>
          <button className="px-3 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition" onClick={handleCopyJSON}>複製 JSON</button>
          {isCloud ? (
            <>
              <button className="px-3 py-2 rounded-full bg-amber-600 text-white text-xs font-medium" onClick={handleSaveNoDeploy} disabled={isSaving}>💾 僅儲存</button>
              <button className="px-3 py-2 rounded-full bg-green-600 text-white text-xs font-medium col-span-2 sm:col-span-1" onClick={handleSave} disabled={isSaving}>🚀 儲存並發布</button>
            </>
          ) : <button className="px-3 py-2 rounded-full bg-blue-600 text-white text-xs font-medium" onClick={handleDownloadJSON}>📥 下載 JSON</button>}
        </div>
      </header>

      {/* 分類管理大師控制卡片 */}
      {isCatManagerOpen && (
        <div className="bg-white rounded-[24px] border border-gray-200 p-5 mb-6 shadow-sm animate-fade-in select-none">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2">🏷️ 核心分類架構設定清冊</h3>
            <button type="button" className="px-3 py-1 bg-black text-white text-xs rounded-full" onClick={addCategory}>+ 創建新分類群</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto p-1">
            {categoryIds.map((id) => (
              <div key={id} className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50/50">
                <div className="flex justify-between items-center">
                  <code className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded font-mono text-[11px] font-bold">{id}</code>
                  <button type="button" className="text-xs text-red-500 font-medium hover:underline" onClick={() => removeCategory(id)}>刪除分類</button>
                </div>
                <div className="space-y-1.5">
                  {["zh", "ja", "en"].map(loc => (
                    <div key={loc} className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase w-5 text-center font-bold">{loc}</span>
                      <input className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white" value={data.categories[id][loc] || ""} onChange={e => updateCategoryI18n(id, loc, e.target.value)} placeholder="名稱..." />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 旗艦工作主版面 */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch gap-6 relative">
        
        {/* 桌機專用彈性側邊媒體櫃 (使用新組件) */}
        <div style={{ width: `${leftPanelWidth}px` }} className="hidden lg:flex bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex-col shrink-0 overflow-hidden h-[820px]">
          <MediaLibrary {...mediaLibraryProps} />
        </div>

        {/* 隱形分割線 */}
        <div onMouseDown={startResize} className="hidden lg:block w-1.5 hover:w-2 bg-transparent hover:bg-gray-300 cursor-col-resize transition shrink-0 self-stretch rounded-full" title="左右拖曳調整管理面板比例" />

        {/* 右側主要編輯清單欄 */}
        <div className="flex-1 space-y-4 lg:h-[820px] lg:overflow-y-auto lg:pr-1 select-text">
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            
            {/* 排序篩選 */}
            <div className="flex flex-col gap-3 justify-between items-stretch border-b border-gray-100 pb-4 mb-4 sm:flex-row sm:items-center">
              <span className="text-sm font-bold text-gray-800">作品清單清冊 ({filteredWorks.length})</span>
              <div className="flex gap-2 text-xs select-none">
                <select className="border border-gray-200 rounded-full px-3 py-1.5 bg-gray-50 font-medium focus:outline-none" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="sequence">預設排序 (Sequence)</option>
                  <option value="title">依照名稱 (Title)</option>
                  <option value="date">依照日期 (Date)</option>
                </select>
                <button className="border border-gray-200 rounded-full px-3 py-1.5 bg-white font-medium hover:bg-gray-50 text-gray-700" onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? "↑ 升冪" : "↓ 降冪"}
                </button>
              </div>
            </div>

            {/* 分頁標籤 */}
            <div className="flex gap-1.5 flex-wrap pb-3 mb-4 select-none">
              <button className={`px-3 py-1.5 text-xs rounded-full border transition font-medium ${activeTab === "all" ? "bg-black text-white" : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"}`} onClick={() => setActiveTab("all")}>全部 ({data.works.length})</button>
              {categoryOptions.map(opt => (
                <button key={`cat-tab-${opt.id}`} className={`px-3 py-1.5 text-xs rounded-full border transition font-medium ${activeTab === opt.id ? "bg-black text-white" : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"}`} onClick={() => setActiveTab(opt.id)}>{opt.label}</button>
              ))}
            </div>

            {/* 作品卡片 */}
            <div className="space-y-4">
              {filteredWorks.map((work) => {
                const i = data.works.indexOf(work); const isActive = activeWorkIndex === i;
                
                return (
                  <div key={work.id} className={classNames("p-4 md:p-5 flex flex-col sm:flex-row gap-5 transition duration-200 border relative group rounded-2xl", isActive ? "bg-gray-50/50 border-black ring-1 ring-black/5" : "bg-white border-gray-100 hover:border-gray-300")} onClick={() => setActiveWorkIndex(i)}>
                    <div className="w-full sm:w-24 shrink-0 flex sm:flex-col justify-between items-center sm:justify-start gap-3 select-none">
                      <div className="w-20 h-20 sm:w-full aspect-square bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative shadow-inner shrink-0">
                        {work.images?.[0] ? (
                          <img src={parseImagePath(work.category, work.images[0])} className="w-full h-full object-cover" alt="" />
                        ) : <div className="text-[10px] text-gray-400 grid place-items-center h-full select-none font-medium">無封面</div>}
                      </div>
                      <div className="flex flex-row gap-1 text-center justify-center">
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg font-mono font-bold" onClick={e => { e.stopPropagation(); moveWork(i, -1); }}>↑</button>
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg font-mono font-bold" onClick={e => { e.stopPropagation(); moveWork(i, 1); }}>↓</button>
                      </div>
                    </div>

                    <div className="flex-1 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">所屬分類 (Category)</span>
                          <select className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-white" value={work.category} onChange={e => updateWork(i, { category: e.target.value })}>{categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">創作日期 (Date)</span>
                          <input type="date" className="w-full border border-gray-200 rounded-xl text-xs p-2 bg-white" value={work.date || ""} onChange={e => updateWork(i, { date: normalizeDateToYMD(e.target.value) })} />
                        </div>
                      </div>

                      <div className="text-[11px] bg-gray-100/80 px-3 py-1.5 rounded-xl font-mono text-gray-500 flex items-center gap-1.5 truncate">
                        <span>🔗 網址 Slug:</span><span className="text-black font-bold tracking-tight">{work.id}</span>
                      </div>

                      {/* 多語系輸入框群組 */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">🏷️ 作品名稱 (Title)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex items-center gap-1.5 border border-gray-200 rounded-xl bg-white px-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase w-4 font-bold text-center">{l}</span>
                              <input className="w-full text-xs py-2 bg-transparent focus:outline-none" value={work.title?.[l] || ""} onChange={e => updateWorkI18n(i, "title", l, e.target.value)} placeholder="請輸入標題..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">💎 媒材材質 (Material)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex items-center gap-1.5 border border-gray-200 rounded-xl bg-white px-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase w-4 font-bold text-center">{l}</span>
                              <input className="w-full text-xs py-2 bg-transparent focus:outline-none" value={work.material?.[l] || ""} onChange={e => updateWorkI18n(i, "material", l, e.target.value)} placeholder="七寶、銀..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">📝 作品敘述說明 (Description)</span>
                        <div className="space-y-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex gap-2 items-start bg-gray-50/50 border border-gray-100 rounded-xl p-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold w-5 text-center mt-2 shrink-0">{l}</span>
                              <textarea className="w-full text-xs bg-transparent focus:outline-none h-14 resize-y leading-relaxed" value={work.desc?.[l] || ""} onChange={e => updateWorkI18n(i, "desc", l, e.target.value)} placeholder="故事背景..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 圖片隊列區域 */}
                      <div onDragOver={e => e.preventDefault()} onDrop={e => handleWorkDropZone(e, i)} className={classNames("border rounded-2xl p-4 bg-gray-50/50 space-y-3 transition duration-150 relative", isActive ? "border-dashed border-gray-400 ring-2 ring-black/5 bg-gray-100/30" : "border-gray-100")}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
                          <span className="text-[11px] font-bold text-gray-700 block">🖼️ 圖片排序隊列（支援將圖片拖曳扔進此處或從圖庫追加）</span>
                          
                          <div className="flex gap-1.5">
                            <button type="button" className="text-[10px] bg-black text-white px-2.5 py-1.5 rounded-lg font-medium tracking-tight shadow-sm hover:bg-gray-800" onClick={() => {
                              setActiveWorkIndex(i); if (!isLibraryLoaded) loadExistingImages(); setIsMobileMediaOpen(true); 
                            }}>＋ 從圖庫加入</button>
                            
                            <label className="text-[10px] bg-white border border-gray-200 text-gray-700 px-2.5 py-1.5 rounded-lg font-medium cursor-pointer text-center hover:bg-gray-50">
                              📁 本地上傳 <input type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && handleDropFiles(e.target.files, i)} />
                            </label>
                          </div>
                        </div>

                        {work.images && work.images.length ? (
                          <div className="space-y-2">
                            {work.images.map((imgName, imgIdx) => {
                              const finalSrc = parseImagePath(work.category, imgName, pendingImages);
                              return (
                                <div key={`${imgName}-${imgIdx}`} className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-xl shadow-xs gap-3 hover:border-black transition">
                                  <div className="flex items-center gap-2 truncate pointer-events-none">
                                    <span className="text-gray-300 font-bold select-none text-xs px-1">☰</span>
                                    {/* 這裡也直接換成內建的 img 或確保全域支援 */}
                                    <img src={finalSrc} className="w-9 h-9 rounded-lg object-cover border shrink-0" alt="" />
                                    <span className="truncate font-mono text-[11px] text-gray-600">{imgName.includes("::") ? imgName.split("::")[1] : imgName}</span>
                                    {imgName.includes("::") && <span className="text-[8px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-sans font-medium">引渡自: {imgName.split("::")[0]}</span>}
                                    {imgIdx === 0 && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full font-sans font-medium">封面</span>}
                                  </div>
                                  <div className="space-x-1 shrink-0 flex items-center">
                                    <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinWork(i, imgIdx, -1)}>↑</button>
                                    <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinWork(i, imgIdx, 1)}>↓</button>
                                    <button type="button" className="text-[10px] text-red-500 border border-red-100 px-2 py-1 rounded-lg bg-red-50/50 hover:bg-red-50" onClick={() => removeImageFromWork(i, imgName)}>移除</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : <p className="text-[11px] text-gray-400 italic">目前相簿為空。</p>}
                      </div>
                    </div>
                    <button type="button" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-full h-9 self-end sm:self-start shrink-0 font-medium mt-2 sm:mt-0" onClick={e => { e.stopPropagation(); removeWork(i); }}>刪除作品</button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* 手機版彈出式 Modal 抽屜 (使用新組件) */}
      {isMobileMediaOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in" onClick={() => setIsMobileMediaOpen(false)}>
          <div className="bg-white w-full max-w-2xl h-[85vh] rounded-[32px] p-5 flex flex-col shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 shrink-0 select-none">
              <div>
                <h4 className="font-bold text-gray-900 text-base">🔍 從媒體圖庫加入相片</h4>
                <p className="text-[11px] text-gray-400 font-medium mt-0.5">點擊任何相片，即可立刻將其安全引入至當前選定的作品中</p>
              </div>
              <button type="button" className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 text-sm font-bold grid place-items-center transition" onClick={() => setIsMobileMediaOpen(false)}>✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <MediaLibrary {...mediaLibraryProps} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}