/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
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

  // 🎯 核心黑科技：智慧網址（Slug）防撞生成器
  // targetId 是目前正在編輯的作品，比對時要排除它自己，避免自我衝突
  const generateSmartSlug = (worksArray, targetWorkId, currentCategory, currentDate, englishTitle) => {
    const cleanDate = (currentDate || new Date().toISOString().slice(0, 10)).replace(/-/g, "");
    let baseSlug = "";

    // 1. 判斷是否有英文標題
    const trimmedTitle = (englishTitle || "").trim().toLowerCase();
    if (trimmedTitle && trimmedTitle !== "no title" && trimmedTitle !== "untitled") {
      baseSlug = slugify(trimmedTitle); // 變成乾淨的標題網址，如 "golden-ring"
    }

    // 2. 如果沒有標題，基本款就是 [分類]-[日期]
    if (!baseSlug) {
      baseSlug = `${currentCategory || "work"}-${cleanDate}`;
    }

    // 3. 檢查除自己之外，JSON 陣列裡是否已經有別人佔用了這個網址
    const otherWorks = worksArray.filter(w => w.id !== targetWorkId);
    const isOccupied = otherWorks.some(w => String(w.id) === baseSlug);

    if (!isOccupied) {
      return baseSlug; // 沒人佔用，直接給它最完美的網址！
    }

    // 4. 如果被佔用了（名字重複），自動加上 -[日期]-[順序]
    // 或者是無標題的狀況，依序往後疊加數字
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
  };

  // 🎯 自動清洗函數：當更新大範圍資料時，跑一次全自動重新配對網址
  const sanitizeAndSyncSlugs = (currentData) => {
    if (!currentData || !Array.isArray(currentData.works)) return currentData;
    
    const processedWorks = [];
    currentData.works.forEach((w) => {
      const item = { ...w };
      item.date = normalizeDateToYMD(item.date || item.year || new Date().toISOString().slice(0, 10));
      item.desc = item.desc || emptyI18n();
      item.material = item.material || emptyI18n();
      item.images = item.images || [];
      
      // 如果 id 為空，或是之前髒掉的 "notitle"，就幫它生成智慧網址
      if (!item.id || item.id === "notitle") {
        item.id = generateSmartSlug(processedWorks, "temp-id", item.category, item.date, item.title?.en);
      }
      processedWorks.push(item);
    });

    return { ...currentData, works: processedWorks };
  };

  useEffect(() => {
    if (isCloud) {
      fetch("/admin/api/r2?file=works.json")
        .then((res) => res.ok ? res.json() : null)
        .then((cloudData) => {
          if (cloudData && cloudData.categories) {
            setData(sanitizeAndSyncSlugs(cloudData)); // 雲端撈下來時自動檢查網址健康度
          }
        })
        .catch(() => console.log("無法自動取得雲端 R2 檔案"));
    }
  }, [isCloud]);

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

  // ---------- CRUD 邏輯 ----------
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
    
    // 建立一個暫時的亂數虛擬 ID 避免 React 碎掉，等一下立即在狀態中更新它
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
      
      // 計算真正的智慧網址
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

  // 🎯 當分類或日期變更時，自動重新計算智慧網址
  const updateWork = (index, patch) => {
    setData(d => {
      const arr = [...d.works];
      const target = { ...arr[index], ...patch };
      
      // 若動到了分類或日期，重新評估網址
      if (patch.category !== undefined || patch.date !== undefined) {
        target.id = generateSmartSlug(arr, target.id, target.category, target.date, target.title?.en);
      }
      
      arr[index] = target;
      return { ...d, works: arr };
    });
  };

  // 🎯 當英文名稱被修改時，觸發全自動 SEO 網址重新計算
  const updateWorkI18n = (index, field, locale, value) => {
    setData(d => { 
      const arr = [...d.works]; 
      const updatedI18nObj = { ...arr[index][field], [locale]: value }; 
      const target = { ...arr[index], [field]: updatedI18nObj };

      // 🔥 核心亮點：如果使用者正在修改「英文標題 (title.en)」，同步即時動態更新前台網址 ID！
      if (field === "title" && locale === "en") {
        target.id = generateSmartSlug(arr, target.id, target.category, target.date, value);
      }

      arr[index] = target; 
      return { ...d, works: arr }; 
    });
  };

  // ---------- 圖片處理與拖拉操作 ----------
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
    <div className="text-slate-900 p-8 bg-slate-50 min-h-screen">
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📁 作品集管理面板</h2>
          <p className="text-xs text-slate-500 mt-1">目前模式：{isCloud ? "☁️ R2 雲端同步" : "💻 本地檔案輸出"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm" onClick={addCategory}>+ 分類</button>
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm" onClick={addWork}>+ 作品</button>
          <button className="px-3 py-1.5 rounded-lg bg-white border text-sm" onClick={copyJSON}>複製 JSON</button>
          
          {isCloud ? (
            <>
              <button className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm disabled:opacity-50" onClick={() => saveToCloud(false)} disabled={isSaving}>
                {isSaving ? "同步中..." : "💾 僅儲存 (不發布)"}
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm disabled:opacity-50" onClick={() => saveToCloud(true)} disabled={isSaving}>
                {isSaving ? "發布中..." : "🚀 儲存並發布網站"}
              </button>
            </>
          ) : (
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm" onClick={exportJSON}>📥 下載作品 JSON</button>
          )}

          <label className="px-3 py-1.5 rounded-lg bg-white border text-sm cursor-pointer">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側欄位 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold mb-3 text-slate-700">分類項目列表</h3>
            <div className="space-y-3">
              {categoryIds.map((id) => (
                <div key={id} className="border rounded-xl p-3 space-y-2 bg-slate-50">
                  <div className="flex justify-between items-center text-xs">
                    <code className="bg-slate-200 px-1.5 py-0.5 rounded font-mono">{id}</code>
                    <div className="space-x-2">
                      <button className="text-blue-600" onClick={() => setActiveTab(id)}>切換</button>
                      <button className="text-red-600" onClick={() => removeCategory(id)}>刪除</button>
                    </div>
                  </div>
                  {["en", "ja", "zh"].map(loc => (
                    <input key={loc} className="w-full text-xs px-2 py-1 border rounded" value={data.categories[id][loc] || ""} onChange={e => updateCategoryI18n(id, loc, e.target.value)} placeholder={`分類名稱 (${loc})`} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-slate-700 mb-2">暫存圖片庫</h3>
            <div className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer bg-slate-50" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && onDropFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-slate-400">拖曳圖片至此或點擊選取</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onDropFiles(e.target.files)} />
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              {imageLibrary.map(img => (
                <button 
                  key={img.id} 
                  type="button"
                  disabled={activeWorkIndex === null}
                  className="border rounded overflow-hidden text-[10px] text-center bg-slate-50 hover:border-blue-500 transition disabled:opacity-60"
                  onClick={() => activeWorkIndex !== null && attachImageToWork(activeWorkIndex, img.name)}
                >
                  <img src={img.url} className="h-16 w-full object-cover" alt="" />
                  <div className="p-1 truncate">{img.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側欄位 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl p-4">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <span className="text-sm font-semibold">作品清單 ({filteredWorks.length})</span>
              <div className="flex gap-2 text-xs">
                <select className="border rounded px-1.5 py-1" value={sortKey} onChange={e => setSortKey(e.target.value)}>
                  <option value="sequence">預設順序</option>
                  <option value="title">名稱排序</option>
                  <option value="date">日期排序</option>
                </select>
                <button className="border rounded px-2" onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}>{sortOrder === "asc" ? "升冪" : "降冪"}</button>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mb-4">
              <button className={`px-2.5 py-1 text-xs rounded-full border ${activeTab === "all" ? "bg-slate-900 text-white" : "bg-white"}`} onClick={() => setActiveTab("all")}>全部 ({data.works.length})</button>
              {categoryOptions.map(opt => (
                <button key={opt.id} className={`px-2.5 py-1 text-xs rounded-full border ${activeTab === opt.id ? "bg-slate-900 text-white" : "bg-white"}`} onClick={() => setActiveTab(opt.id)}>{opt.label}</button>
              ))}
            </div>

            <div className="divide-y max-h-[800px] overflow-y-auto pr-1">
              {filteredWorks.map((work) => {
                const i = data.works.indexOf(work);
                const isActive = activeWorkIndex === i;
                
                return (
                  <div key={work.id} className={classNames("p-4 flex gap-4 transition cursor-pointer", isActive ? "bg-blue-50/60 ring-1 ring-blue-200 rounded-xl" : "hover:bg-slate-50")} onClick={() => setActiveWorkIndex(i)}>
                    
                    <div className="w-24 shrink-0">
                      <div className="aspect-square bg-slate-100 rounded-xl border overflow-hidden">
                        {work.images?.[0] ? (
                          <img src={imageSrcFor(work, work.images[0])} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="text-[10px] text-slate-400 grid place-items-center h-full">無圖片</div>
                        )}
                      </div>
                      <div className="flex gap-1 mt-2 text-center justify-center">
                        <button type="button" className="border bg-white px-2 py-0.5 text-xs rounded hover:bg-slate-100" onClick={e => { e.stopPropagation(); moveWork(i, -1); }}>↑</button>
                        <button type="button" className="border bg-white px-2 py-0.5 text-xs rounded hover:bg-slate-100" onClick={e => { e.stopPropagation(); moveWork(i, 1); }}>↓</button>
                      </div>
                      <label className="flex items-center gap-1 justify-center mt-2 text-[11px] text-slate-500 cursor-pointer">
                        <input type="checkbox" checked={work.showFullDate || false} onChange={e => updateWork(i, { showFullDate: e.target.checked })} />
                        完整日期
                      </label>
                    </div>

                    <div className="flex-1 space-y-3" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-2 gap-2">
                        <select className="border rounded text-xs p-1.5" value={work.category} onChange={e => updateWork(i, { category: e.target.value })}>
                          {categoryOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                        <input type="date" className="border rounded text-xs p-1.5" value={work.date || ""} onChange={e => updateWork(i, { date: normalizeDateToYMD(e.target.value) })} />
                      </div>

                      {/* 💡 當你在上方的 Title (en) 打字時，這裡會一邊打字一邊呈現最新的 SEO 動態網址！超療癒！ */}
                      <div className="text-[11px] bg-slate-100 px-2 py-1 rounded font-mono text-slate-600 truncate">
                        🔗 網址動態 Slug：<span className="text-blue-600 font-bold">{work.id}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-1">🏷️ 作品名稱 (Title)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {["en", "ja", "zh"].map(l => (
                            <input 
                              key={l} 
                              className="border rounded text-xs p-1.5" 
                              value={work.title?.[l] || ""} 
                              onChange={e => updateWorkI18n(i, "title", l, e.target.value)} 
                              placeholder={`名稱 (${l})`} 
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-1">💎 媒材材質 (Material)</span>
                        <div className="grid grid-cols-3 gap-2">
                          {["en", "ja", "zh"].map(l => (
                            <input key={l} className="border rounded text-xs p-1.5" value={work.material?.[l] || ""} onChange={e => updateWorkI18n(i, "material", l, e.target.value)} placeholder={`材質 (${l})`} />
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-1">📝 作品敘述說明 (Description)</span>
                        <div className="grid grid-cols-1 gap-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex gap-1 items-start">
                              <span className="text-[10px] uppercase font-mono text-slate-400 w-6 mt-2">{l}:</span>
                              <textarea 
                                className="border rounded text-xs p-1.5 flex-1 h-16 resize-y" 
                                value={work.desc?.[l] || ""} 
                                onChange={e => updateWorkI18n(i, "desc", l, e.target.value)} 
                                placeholder={`請輸入作品的敘述...`}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border rounded-xl p-3 bg-slate-50 space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 block flex justify-between items-center">
                          <span>🖼️ 圖片隊列（滑鼠滑動「直接拖曳圖片」調整前後順序）</span>
                        </span>
                        
                        {work.images && work.images.length ? (
                          <div className="space-y-1.5">
                            {work.images.map((imgName, imgIdx) => (
                              <div 
                                key={`${imgName}-${imgIdx}`} 
                                draggable
                                onDragStart={() => handleImageDragStart(imgIdx)}
                                onDragOver={handleImageDragOver}
                                onDrop={() => handleImageDrop(i, imgIdx)}
                                className="flex justify-between items-center text-xs bg-white border p-2 rounded-lg shadow-sm gap-2 cursor-grab active:cursor-grabbing border-slate-200 hover:border-blue-400 transition"
                              >
                                <div className="flex items-center gap-2 truncate pointer-events-none">
                                  <span className="text-slate-300 font-bold select-none text-xs">☰</span>
                                  <img src={imageSrcFor(work, imgName)} className="w-8 h-8 rounded object-cover border shrink-0" alt="" />
                                  <span className="truncate font-mono text-[11px] text-slate-600">{imgName}</span>
                                  {imgIdx === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded font-sans">封面</span>}
                                </div>
                                
                                <div className="space-x-1 shrink-0 flex items-center">
                                  <button type="button" className="text-[10px] border bg-slate-50 px-1 py-0.5 rounded text-slate-400 hover:bg-slate-100" onClick={() => moveImageWithinWork(i, imgIdx, -1)}>↑</button>
                                  <button type="button" className="text-[10px] border bg-slate-50 px-1 py-0.5 rounded text-slate-400 hover:bg-slate-100" onClick={() => moveImageWithinWork(i, imgIdx, 1)}>↓</button>
                                  <button type="button" className="text-[10px] text-red-500 border border-red-100 px-1.5 py-0.5 rounded bg-red-50/30 hover:bg-red-50" onClick={() => removeImageFromWork(i, imgName)}>移除</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">尚未附加任何圖片。</p>
                        )}
                      </div>
                    </div>
                    
                    <button type="button" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-2 py-1 rounded h-8 self-start" onClick={e => { e.stopPropagation(); removeWork(i); }}>刪除</button>
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