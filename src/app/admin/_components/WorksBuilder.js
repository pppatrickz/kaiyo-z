/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { slugify } from "@/app/_lib/slugify"; 

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

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function WorksBuilder({ isCloud }) {
  const [data, setData] = useState({ categories: {}, works: [] });
  const [activeWorkIndex, setActiveWorkIndex] = useState(null);
  const [imageLibrary, setImageLibrary] = useState([]); 
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const draggingImageIndexRef = useRef(null);

  const [sortKey, setSortKey] = useState("sequence"); 
  const [sortOrder, setSortOrder] = useState("asc");  
  const [activeTab, setActiveTab] = useState("all");

  const categoryIds = useMemo(() => Object.keys(data.categories), [data.categories]);
  const categoryOptions = useMemo(
    () => categoryIds.map((id) => ({ id, label: data.categories[id]?.en || id })),
    [categoryIds, data.categories]
  );

  // 🎯 修正點：使用 useCallback 鎖定智慧網址 Slug 生成器
  const generateSmartSlug = useCallback((worksArray, targetWorkId, currentCategory, currentDate, englishTitle) => {
    const cleanDate = (currentDate || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
    let baseSlug = "";

    const trimmedTitle = (englishTitle || "").trim().toLowerCase();
    if (trimmedTitle && trimmedTitle !== "no title" && trimmedTitle !== "untitled") {
      baseSlug = slugify(trimmedTitle);
    }

    if (!baseSlug) {
      baseSlug = `${currentCategory || "work"}-${cleanDate}`;
    }

    const otherWorks = worksArray.filter(w => w.id !== targetWorkId);
    const isOccupied = otherWorks.some(w => String(w.id) === baseSlug);

    if (!isOccupied) {
      return baseSlug;
    }

    let suffixCounter = 1;
    let finalSlug = baseSlug.includes(cleanDate) 
      ? `${baseSlug}-${suffixCounter}` 
      : `${baseSlug}-${cleanDate}-${suffixCounter}`;

    while (otherWorks.some(w => String(w.id) === finalSlug)) {
      suffixCounter++;
      finalSlug = baseSlug.includes(cleanDate)
        ? `${baseSlug}-${suffixCounter}`
        : `${baseSlug}-${cleanDate}-${suffixCounter}`;
    }

    return finalSlug;
  }, []);

  // 🎯 修正點：使用 useCallback 鎖定作品資料清洗功能，並注入依賴
  const sanitizeAndSyncSlugs = useCallback((currentData) => {
    if (!currentData || !Array.isArray(currentData.works)) return currentData;
    
    const processedWorks = [];
    currentData.works.forEach((w) => {
      const item = { ...w };
      item.date = normalizeDateToYMD(item.date || item.year || new Date().toISOString().slice(0, 10));
      item.desc = item.desc || emptyI18n();
      item.material = item.material || emptyI18n();
      item.images = item.images || [];
      
      if (!item.id || item.id === "notitle") {
        item.id = generateSmartSlug(processedWorks, "temp-id", item.category, item.date, item.title?.en);
      }
      processedWorks.push(item);
    });

    return { ...currentData, works: processedWorks };
  }, [generateSmartSlug]);

  // 🎯 修正點：初始化資料處理，依賴陣列加上安全鎖定後的 sanitizeAndSyncSlugs
  useEffect(() => {
    if (isCloud) {
      fetch("/admin/api/r2?file=works.json")
        .then((res) => res.ok ? res.json() : null)
        .then((cloudData) => {
          if (cloudData && cloudData.categories) {
            setData(sanitizeAndSyncSlugs(cloudData));
          }
        })
        .catch(() => console.log("無法自動取得雲端 R2 檔案"));
    } else {
      // 💻 本地環境：改成用 POST 去敲本地 API，並告訴它我們要 action: "read"
      fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", file: "works.json" })
      })
        .then((res) => res.ok ? res.json() : null)
        .then((localData) => {
          if (localData) setData(sanitizeAndSyncSlugs(localData));
        })
        .catch(() => console.log("本地自動載入失敗"));
    }
  }, [isCloud, sanitizeAndSyncSlugs]);

  const saveToCloud = async (shouldDeploy = true) => {
    setIsSaving(true);
    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: "works.json", data, deploy: shouldDeploy }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert(shouldDeploy ? "🎉 資料已寫入 R2 雲端，自動打包部署已同步觸發！" : "💾 資料已儲存至 R2（暫不發布更新）。");
      } else {
        alert(`錯誤: ${resData.error}`);
      }
    } catch {
      alert("儲存至雲端失敗，請檢查網路或設定");
    } finally {
      setIsSaving(false);
    }
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify(data, null, 2), "works.json", "application/json");
  };

  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("JSON 已複製到剪貼簿");
  };

  const importFromFile = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.categories || !parsed.works) throw new Error("無效的資料格式");
      
      const cleanData = sanitizeAndSyncSlugs(parsed);
      setData(cleanData);
      setActiveWorkIndex(null);
      setActiveTab("all");
    } catch (e) { alert(e.message); }
  };

  const addCategory = () => {
    const newId = prompt("請輸入分類鍵值 (例如 illustration):");
    if (!newId || data.categories[newId]) return;
    setData(d => ({ ...d, categories: { ...d.categories, [newId]: emptyI18n() } }));
    setActiveTab(newId);
  };
  const removeCategory = (id) => {
    if (!confirm(`刪除分類 "${id}"？`)) return;
    setData(d => { const copy = { ...d.categories }; delete copy[id]; return { ...d, categories: copy }; });
    if (activeTab === id) setActiveTab("all");
  };
  const updateCategoryI18n = (id, locale, value) => {
    setData(d => ({ ...d, categories: { ...d.categories, [id]: { ...d.categories[id], [locale]: value } } }));
  };
  
  const addWork = () => {
    const defaultCat = activeTab !== "all" ? activeTab : (categoryOptions[0]?.id || "uncategorized");
    const todayStr = new Date().toISOString().slice(0, 10);
    const tempId = `temp-${crypto.randomUUID()}`;

    const newWork = { 
      id: tempId, 
      category: defaultCat, 
      title: emptyI18n(), 
      date: todayStr, 
      showFullDate: false, 
      material: emptyI18n(), 
      desc: emptyI18n(), 
      images: [] 
    };

    setData(d => {
      const arr = [...d.works];
      let idx = 0;
      if (activeTab !== "all") { const f = arr.findIndex(w => w.category === activeTab); idx = f === -1 ? arr.length : f; }
      
      newWork.id = generateSmartSlug(arr, tempId, defaultCat, todayStr, "");
      arr.splice(idx, 0, newWork);
      return { ...d, works: arr };
    });
    setActiveWorkIndex(0);
  };

  const removeWork = (index) => {
    if (!confirm("確定刪除此作品？")) return;
    setData(d => ({ ...d, works: d.works.filter((_, i) => i !== index) }));
    if (activeWorkIndex === index) setActiveWorkIndex(null);
  };
  const moveWork = (index, dir) => {
    setData(d => {
      const arr = [...d.works]; const ni = index + dir;
      if (ni < 0 || ni >= arr.length) return d;
      const [item] = arr.splice(index, 1); arr.splice(ni, 0, item);
      return { ...d, works: arr };
    });
    setActiveWorkIndex(i => i === null ? i : i + dir);
  };

  const updateWork = (index, patch) => {
    setData(d => {
      const arr = [...d.works];
      const target = { ...arr[index], ...patch };
      
      if (patch.category !== undefined || patch.date !== undefined) {
        target.id = generateSmartSlug(arr, target.id, target.category, target.date, target.title?.en);
      }
      
      arr[index] = target;
      return { ...d, works: arr };
    });
  };

  const updateWorkI18n = (index, field, locale, value) => {
    setData(d => { 
      const arr = [...d.works]; 
      const updatedI18nObj = { ...arr[index][field], [locale]: value }; 
      const target = { ...arr[index], [field]: updatedI18nObj };

      if (field === "title" && locale === "en") {
        target.id = generateSmartSlug(arr, target.id, target.category, target.date, value);
      }

      arr[index] = target; 
      return { ...d, works: arr }; 
    });
  };

  const onDropFiles = (files) => {
    const newAssets = [];
    Array.from(files).forEach((f) => {
      const id = `${f.name}-${f.size}-${f.lastModified}`;
      if (!imageLibrary.some(a => a.id === id)) newAssets.push({ id, file: f, name: f.name, url: URL.createObjectURL(f) });
    });
    if (newAssets.length) setImageLibrary(lib => [...lib, ...newAssets]);
  };

  const attachImageToWork = (idx, name) => { 
    setData(d => { 
      const arr = [...d.works]; 
      arr[idx] = { ...arr[idx], images: Array.from(new Set([...(arr[idx].images || []), name])) };
      return { ...d, works: arr }; 
    }); 
  };
  const removeImageFromWork = (idx, name) => { 
    setData(d => { 
      const arr = [...d.works]; 
      arr[idx] = { ...arr[idx], images: (arr[idx].images || []).filter(n => n !== name) };
      return { ...d, works: arr }; 
    }); 
  };
  const moveImageWithinWork = (idx, imgIdx, dir) => {
    setData(d => {
      const arr = [...d.works]; const imgs = [...(arr[idx].images || [])]; const ni = imgIdx + dir;
      if (ni < 0 || ni >= imgs.length) return d;
      const [it] = imgs.splice(imgIdx, 1); imgs.splice(ni, 0, it); 
      arr[idx] = { ...arr[idx], images: imgs }; return { ...d, works: arr };
    });
  };

  const handleImageDragStart = (imgIdx) => { draggingImageIndexRef.current = imgIdx; };
  const handleImageDragOver = (e) => { e.preventDefault(); };
  const handleImageDrop = (workIdx, targetImgIdx) => {
    const draggedIdx = draggingImageIndexRef.current;
    if (draggedIdx === null || draggedIdx === targetImgIdx) return;
    setData(d => {
      const arr = [...d.works]; const imgs = [...(arr[workIdx].images || [])];
      const [draggedItem] = imgs.splice(draggedIdx, 1); imgs.splice(targetImgIdx, 0, draggedItem);
      arr[workIdx] = { ...arr[workIdx], images: imgs }; return { ...d, works: arr };
    });
    draggingImageIndexRef.current = null;
  };

  const imageSrcFor = (work, name) => {
    const inLib = imageLibrary.find(a => a.name === name);
    return inLib ? inLib.url : `/works/${work.category}/${name}`;
  };

  const filteredWorks = useMemo(() => {
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
  }, [data.works, activeTab, sortKey, sortOrder]);

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {/* 🎯 頂部控制列：手機版自動重組為寬敞、易觸控的響應式按鈕網格 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">📁 作品集管理面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Mode: {isCloud ? "☁️ Cloudflare R2 Sync" : "💻 Local File Export"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <button className="px-3 py-2 rounded-full bg-black text-white text-xs font-medium shadow-sm hover:bg-gray-800 transition" onClick={addCategory}>+ 新增分類</button>
          <button className="px-3 py-2 rounded-full bg-black text-white text-xs font-medium shadow-sm hover:bg-gray-800 transition" onClick={addWork}>+ 新增作品</button>
          <button className="px-3 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition" onClick={copyJSON}>複製 JSON</button>
          
          {isCloud ? (
            <>
              <button className="px-3 py-2 rounded-full bg-amber-600 text-white text-xs font-medium disabled:opacity-50" onClick={() => saveToCloud(false)} disabled={isSaving}>
                {isSaving ? "儲存中..." : "💾 僅儲存"}
              </button>
              <button className="px-3 py-2 rounded-full bg-green-600 text-white text-xs font-medium disabled:opacity-50 col-span-2 sm:col-span-1" onClick={() => saveToCloud(true)} disabled={isSaving}>
                {isSaving ? "發布中..." : "🚀 儲存並發布網站"}
              </button>
            </>
          ) : (
            <button className="px-3 py-2 rounded-full bg-blue-600 text-white text-xs font-medium" onClick={exportJSON}>📥 下載 JSON</button>
          )}

          <label className="px-3 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      {/* 主工作區：手機版單欄垂直流動，桌機維持三欄配比 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側輔助欄（分類管理 & 圖片庫）：手機版自動排到上方，降低操作深度 */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 分類管理卡片：圓潤白淨風 */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm mb-4 text-gray-800 flex items-center gap-2">🏷️ 分類項目清單</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {categoryIds.map((id) => (
                <div key={id} className="border border-gray-100 rounded-xl p-3.5 space-y-2 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <code className="bg-gray-200/70 text-gray-700 px-2 py-0.5 rounded font-mono text-[11px] font-bold">{id}</code>
                    <div className="space-x-3 text-xs font-medium">
                      <button className="text-blue-600 hover:text-blue-700" onClick={() => setActiveTab(id)}>切換</button>
                      <button className="text-red-500 hover:text-red-600" onClick={() => removeCategory(id)}>刪除</button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {["zh", "ja", "en"].map(loc => (
                      <div key={loc} className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-gray-400 uppercase w-5 text-center">{loc}</span>
                        <input className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-black transition" value={data.categories[id][loc] || ""} onChange={e => updateCategoryI18n(id, loc, e.target.value)} placeholder={`分類名稱 (${loc})`} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 媒體快取庫：整合拖曳優化 */}
          <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm text-gray-800 mb-3">🖼️ 暫存媒體櫃</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer bg-gray-50 hover:bg-gray-100/50 transition" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && onDropFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-gray-400 font-medium">拖曳圖片至此或點擊選取庫</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onDropFiles(e.target.files)} />
            </div>
            
            {/* 圖片九宮格 */}
            <div className="grid grid-cols-3 gap-2 mt-4 max-h-[240px] overflow-y-auto pr-1">
              {imageLibrary.map(img => (
                <button 
                  key={img.id} 
                  type="button"
                  disabled={activeWorkIndex === null}
                  className="border border-gray-100 rounded-xl overflow-hidden text-[10px] text-center bg-gray-50 hover:border-black transition disabled:opacity-40 p-1 space-y-1"
                  onClick={() => activeWorkIndex !== null && attachImageToWork(activeWorkIndex, img.name)}
                  title={activeWorkIndex === null ? "請先在右側點選一個作品再附加圖片" : "點擊將此圖附加至選定作品"}
                >
                  <img src={img.url} className="h-14 w-full object-cover rounded-lg" alt="" />
                  <div className="px-1 truncate font-mono text-[9px] text-gray-500">{img.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側主要編輯欄：佔據 2/3 寬度，承載核心資料流 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            
            {/* 清單控制列：含篩選與基礎排序 */}
            <div className="flex flex-col gap-3 justify-between items-stretch border-b border-gray-100 pb-4 mb-4 sm:flex-row sm:items-center">
              <span className="text-sm font-bold text-gray-800">作品清單清冊 ({filteredWorks.length})</span>
              <div className="flex gap-2 text-xs">
                <select className="border border-gray-200 rounded-full px-3 py-1.5 bg-gray-50 text-gray-700 font-medium focus:outline-none" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="sequence">預設排序 (Sequence)</option>
                  <option value="title">依照名稱 (Title)</option>
                  <option value="date">依照日期 (Date)</option>
                </select>
                <button className="border border-gray-200 rounded-full px-3 py-1.5 bg-white font-medium hover:bg-gray-50 transition text-gray-700" onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>
                  {sortOrder === "asc" ? "↑ 升冪" : "↓ 降冪"}
                </button>
              </div>
            </div>

            {/* 橫向滾動分類頁籤（手機支援滑動） */}
            <div className="flex gap-1.5 flex-nowrap overflow-x-auto pb-3 mb-4 no-scrollbar snap-x">
              <button className={`px-3 py-1.5 text-xs rounded-full border transition shrink-0 snap-start font-medium ${activeTab === "all" ? "bg-black text-white shadow-sm" : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"}`} onClick={() => setActiveTab("all")}>全部 ({data.works.length})</button>
              {categoryOptions.map(opt => (
                <button key={opt.id} className={`px-3 py-1.5 text-xs rounded-full border transition shrink-0 snap-start font-medium ${activeTab === opt.id ? "bg-black text-white shadow-sm" : "bg-gray-50 text-gray-600 border-transparent hover:bg-gray-100"}`} onClick={() => setActiveTab(opt.id)}>{opt.label}</button>
              ))}
            </div>

            {/* 作品編輯主卡片陣列 */}
            <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1">
              {filteredWorks.map((work) => {
                const i = data.works.indexOf(work);
                const isActive = activeWorkIndex === i;
                
                return (
                  <div 
                    key={work.id} 
                    className={classNames(
                      "p-4 md:p-5 flex flex-col sm:flex-row gap-5 transition duration-200 border relative group rounded-2xl", 
                      isActive 
                        ? "bg-gray-50/50 border-black ring-1 ring-black/5" 
                        : "bg-white border-gray-100 hover:border-gray-300"
                    )} 
                    onClick={() => setActiveWorkIndex(i)}
                  >
                    
                    {/* 左側微型圖片快顯控制 */}
                    <div className="w-full sm:w-24 shrink-0 flex sm:flex-col justify-between items-center sm:justify-start gap-3">
                      <div className="w-20 h-20 sm:w-full aspect-square bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative shadow-inner shrink-0">
                        {work.images?.[0] ? (
                          <img src={imageSrcFor(work, work.images[0])} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="text-[10px] text-gray-400 grid place-items-center h-full select-none font-medium">無封面</div>
                        )}
                      </div>
                      <div className="flex flex-row sm:flex-row gap-1 text-center justify-center">
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg hover:bg-gray-50 shadow-xs font-mono font-bold" onClick={e => { e.stopPropagation(); moveWork(i, -1); }}>↑</button>
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg hover:bg-gray-50 shadow-xs font-mono font-bold" onClick={e => { e.stopPropagation(); moveWork(i, 1); }}>↓</button>
                      </div>
                      <label className="flex items-center gap-1.5 justify-center text-[11px] text-gray-500 cursor-pointer font-medium select-none">
                        <input type="checkbox" className="rounded text-black focus:ring-0" checked={work.showFullDate || false} onChange={e => updateWork(i, { showFullDate: e.target.checked })} />
                        完整日期
                      </label>
                    </div>

                    {/* 右側核心表單輸入區 */}
                    <div className="flex-1 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">所屬分類 (Category)</span>
                          <select className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-white focus:outline-none focus:border-black" value={work.category} onChange={e => updateWork(i, { category: e.target.value })}>
                            {categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">創作日期 (Date)</span>
                          <input type="date" className="w-full border border-gray-200 rounded-xl text-xs p-2 bg-white focus:outline-none focus:border-black" value={work.date || ""} onChange={e => updateWork(i, { date: normalizeDateToYMD(e.target.value) })} />
                        </div>
                      </div>

                      {/* 智慧網址展示條 */}
                      <div className="text-[11px] bg-gray-100/80 px-3 py-1.5 rounded-xl font-mono text-gray-500 flex items-center gap-1.5 truncate">
                        <span className="select-none">🔗 網址 Slug:</span>
                        <span className="text-black font-bold tracking-tight">{work.id}</span>
                      </div>

                      {/* 作品名稱多語系 */}
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

                      {/* 媒材多語系 */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">💎 媒材材質 (Material)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex items-center gap-1.5 border border-gray-200 rounded-xl bg-white px-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase w-4 font-bold text-center">{l}</span>
                              <input className="w-full text-xs py-2 bg-transparent focus:outline-none" value={work.material?.[l] || ""} onChange={e => updateWorkI18n(i, "material", l, e.target.value)} placeholder="例如: 七寶、銀..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 敘述多語系 */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">📝 作品敘述說明 (Description)</span>
                        <div className="space-y-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex gap-2 items-start bg-gray-50/50 border border-gray-100 rounded-xl p-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold w-5 text-center mt-2 shrink-0">{l}</span>
                              <textarea className="w-full text-xs bg-transparent focus:outline-none h-14 resize-y leading-relaxed" value={work.desc?.[l] || ""} onChange={e => updateWorkI18n(i, "desc", l, e.target.value)} placeholder={`請輸入${l === "zh" ? "中文" : l === "ja" ? "日文" : "英文"}的作品詳細故事背景...`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 圖片管理隊列 */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <span className="text-[11px] font-bold text-gray-700 block">
                          🖼️ 圖片排序隊列（滑鼠可直覺「長按拖曳」調整前後位置）
                        </span>
                        
                        {work.images && work.images.length ? (
                          <div className="space-y-2">
                            {work.images.map((imgName, imgIdx) => (
                              <div 
                                key={`${imgName}-${imgIdx}`} 
                                draggable
                                onDragStart={() => handleImageDragStart(imgIdx)}
                                onDragOver={handleImageDragOver}
                                onDrop={() => handleImageDrop(i, imgIdx)}
                                className="flex justify-between items-center bg-white border border-gray-100 p-2 rounded-xl shadow-xs gap-3 cursor-grab active:cursor-grabbing hover:border-black transition"
                              >
                                <div className="flex items-center gap-2 truncate pointer-events-none">
                                  <span className="text-gray-300 font-bold select-none text-xs px-1">☰</span>
                                  <img src={imageSrcFor(work, imgName)} className="w-9 h-9 rounded-lg object-cover border shrink-0" alt="" />
                                  <span className="truncate font-mono text-[11px] text-gray-600">{imgName}</span>
                                  {imgIdx === 0 && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full font-sans font-medium">封面</span>}
                                </div>
                                
                                <div className="space-x-1 shrink-0 flex items-center">
                                  <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinWork(i, imgIdx, -1)}>↑</button>
                                  <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinWork(i, imgIdx, 1)}>↓</button>
                                  <button type="button" className="text-[10px] text-red-500 border border-red-100 px-2 py-1 rounded-lg bg-red-50/50 hover:bg-red-50" onClick={() => removeImageFromWork(i, imgName)}>移除</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">目前尚未附加圖片。請在左側暫存圖片庫點選上傳的圖檔加入。</p>
                        )}
                      </div>
                    </div>
                    
                    {/* 獨立刪除按鈕 */}
                    <button type="button" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-full h-9 self-end sm:self-start shrink-0 font-medium mt-2 sm:mt-0" onClick={e => { e.stopPropagation(); removeWork(i); }}>
                      刪除作品
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}