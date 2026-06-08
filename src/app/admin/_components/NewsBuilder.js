/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

// 建立空的多語系物件結構
const emptyI18n = () => ({ en: "", ja: "", zh: "" });

// 輔助函式：從自由輸入的日期字串中，安全地擷取出 YYYY-MM-DD 格式，用來生成一意性 ID
function extractISODatePrefix(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const cleaned = String(dateStr).trim();
  
  // 如果已經是完美的 YYYY-MM-DD 格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  
  // 若無法直接解析，嘗試用正則表達式撈取年月日數字，否則以今天日期為備份防呆
  const match = cleaned.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (match) {
    const [_, y, m, d] = match;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  
  return new Date().toISOString().slice(0, 10);
}

// 本地環境下，安全地進行 JSON 檔案匯出與下載
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

export default function NewsBuilder({ isCloud }) {
  const [news, setNews] = useState([]);
  const [activeIndex, setActiveIndex] = useState(null);
  const [imageLibrary, setImageLibrary] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  // 用於管理新聞相簿內部圖片拖曳順序的指標
  const draggingImageIndexRef = useRef(null);

  // 🎯 核心邏輯：自動生成以日期為基礎、不重複的智慧型消息 ID (網址 Slug)
  const generateSmartNewsId = (newsArray, targetNewsId, dateString) => {
    const baseDatePrefix = extractISODatePrefix(dateString); // 取得如 "2026-06-08" 的前綴
    
    // 排除自己，過濾出其餘的所有快訊公告
    const otherNews = newsArray.filter(n => n.id !== targetNewsId);
    
    let counter = 1;
    let finalId = `${baseDatePrefix}-${counter}`;
    
    // 如果發現最終產出的 ID 與別人撞名，後方的序號計數器就自動累加 (+1)
    while (otherNews.some(n => String(n.id) === finalId)) {
      counter++;
      finalId = `${baseDatePrefix}-${counter}`;
    }
    
    return finalId;
  };

  // 🎯 資料結構清洗與修復函數（匯入或從雲端讀取時，自動將舊版的 slug 安全轉換至 id）
  const sanitizeAndSyncNews = (rawArray) => {
    if (!Array.isArray(rawArray)) return [];
    
    const processedNews = [];
    rawArray.forEach((n) => {
      const item = { ...n };
      
      // 相容性防護：將舊資料的 slug 欄位無縫導向至新的 id 鍵值上
      item.id = item.id || item.slug || `temp-${Date.now()}`;
      if (item.slug) delete item.slug; 
      
      item.image = item.image || "";
      item.alt = item.alt || "";
      item.date = item.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); 
      item.title = item.title || emptyI18n();
      item.content = item.content || emptyI18n();
      item.images = Array.isArray(item.images) ? item.images : [];
      
      // 如果發現原有的 ID 為髒資料（如舊的超長 UUID 或隨機值），自動將其優化清洗為優雅的日期序號格式
      if (item.id.startsWith("temp-") || item.id.includes("-") && item.id.length > 20) {
        item.id = generateSmartNewsId(processedNews, item.id, item.date);
      }
      
      processedNews.push(item);
    });
    
    return processedNews;
  };

  // 1. 初始化資料處理：從 Cloudflare R2 生產環境同步撈取 news.json
  useEffect(() => {
    if (isCloud) {
      fetch("/admin/api/r2?file=news.json")
        .then((res) => res.ok ? res.json() : null)
        .then((cloudData) => {
          if (cloudData) {
            setNews(sanitizeAndSyncNews(cloudData));
          }
        })
        .catch(() => console.log("雲端儲存桶尚未找到 news.json 檔案"));
    }
  }, [isCloud]);

  // 2. 統整並重組輸出的標準資料欄位（確保 id 對齊，欄位完整乾淨）
  const assembleOutput = () => {
    return news.map((n) => ({
      id: n.id, 
      image: n.image || "",
      alt: n.alt || "",
      date: n.date, // 保持使用者自由輸入的排版字串（例如 "October 13, 2025"）
      title: { en: n.title?.en || "", ja: n.title?.ja || "", zh: n.title?.zh || "" },
      content: { en: n.content?.en || "", ja: n.content?.ja || "", zh: n.content?.zh || "" },
      images: Array.isArray(n.images) ? n.images : [],
    }));
  };

  // 將資料更新同步至 R2 雲端（可自選是否同步觸發 Vercel/Cloudflare Pages 打包部署）
  const saveToCloud = async (shouldDeploy = true) => {
    setIsSaving(true);
    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: "news.json", data: assembleOutput(), deploy: shouldDeploy }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert(shouldDeploy ? "🎉 消息數據已成功同步至 R2，專案打包部署自動觸發中！" : "💾 消息數據已更新至 R2（暫不觸發網站重新生成）。");
      } else {
        alert(`同步失敗: ${resData.error}`);
      }
    } catch {
      alert("連線雲端 API 失敗，請確認網路環境或環境變數設定。");
    } finally { setIsSaving(false); }
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify(assembleOutput(), null, 2), "news.json", "application/json");
  };

  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(assembleOutput(), null, 2));
    alert("最新的 News JSON 結構內容已成功複製至剪貼簿！");
  };

  // 本地端 JSON 檔案上傳與轉換整合
  const importFromFile = async (file) => {
    try {
      const text = await file.text(); 
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("無效的結構，News 的 JSON 最外層必須為陣列型態。");
      
      setNews(sanitizeAndSyncNews(parsed)); 
      setActiveIndex(null);
    } catch (e) { alert(`匯入失敗: ${e.message}`); }
  };

  // ---------- 新聞公告 CRUD 核心操作邏輯 ----------
  const addNews = () => {
    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const tempId = `temp-${Date.now()}`;
    
    const item = { 
      id: tempId, 
      image: "", 
      alt: "New Post", 
      date: todayStr, 
      title: emptyI18n(), 
      content: emptyI18n(), 
      images: [] 
    };
    
    setNews(prev => {
      // 新增時立即對齊智慧型 ID，預設將新消息排序塞在陣列的最頂端
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
      const ni = idx + dir; 
      if (ni < 0 || ni >= prev.length) return prev; 
      const c = [...prev]; 
      const [it] = c.splice(idx, 1); 
      c.splice(ni, 0, it); 
      return c; 
    });
    setActiveIndex(i => i === null ? i : i + dir);
  };

  // 🎯 當使用者更動顯示日期字串時，系統會同步、即時地重新調配、校正前台網址 Slug (ID)
  const updateNews = (idx, patch) => { 
    setNews(prev => { 
      const c = [...prev]; 
      const target = { ...c[idx], ...patch };
      
      if (patch.date !== undefined) {
        target.id = generateSmartNewsId(c, target.id, patch.date);
      }
      
      c[idx] = target; 
      return c; 
    }); 
  };

  const updateI18n = (idx, field, loc, val) => { 
    setNews(prev => { 
      const c = [...prev]; 
      c[idx][field] = { ...c[idx][field], [loc]: val }; 
      return c; 
    }); 
  };

  // ---------- 圖片快取庫上傳與相簿托拉排序處理 ----------
  const onDropFiles = (files) => {
    const arr = []; 
    Array.from(files).forEach(f => { 
      const id = `${f.name}-${f.size}`;
      if (!imageLibrary.some(a => a.id === id)) {
        arr.push({ id, name: f.name, url: URL.createObjectURL(f) }); 
      }
    });
    if (arr.length) setImageLibrary(p => [...p, ...arr]);
  };

  const attachImageToItem = (idx, name) => { 
    setNews(prev => { 
      const c = [...prev]; 
      const currentImages = c[idx].images || [];
      c[idx].images = Array.from(new Set([...currentImages, name])); 
      // 若原先公告無封面，預設將上傳的第一張圖片指定為該新聞封面
      if (!c[idx].image) c[idx].image = name;
      return c; 
    }); 
  };

  const removeImageFromItem = (idx, name) => { 
    setNews(p => { 
      const c = [...p]; 
      c[idx].images = (c[idx].images || []).filter(n => n !== name); 
      // 若移除的剛好是主封面，自動將剩下圖片的第一張遞補為新封面
      if (c[idx].image === name) {
        c[idx].image = c[idx].images[0] || ""; 
      }
      return c; 
    }); 
  };

  const moveImageWithinItem = (idx, imgIdx, dir) => {
    setNews(p => {
      const c = [...p];
      const imgs = [...(c[idx].images || [])];
      const ni = imgIdx + dir;
      if (ni < 0 || ni >= imgs.length) return p;
      const [it] = imgs.splice(imgIdx, 1);
      imgs.splice(ni, 0, it);
      c[idx].images = imgs;
      return c;
    });
  };

  const handleImageDragStart = (imgIdx) => { draggingImageIndexRef.current = imgIdx; };
  const handleImageDragOver = (e) => { e.preventDefault(); };
  const handleImageDrop = (newsIdx, targetImgIdx) => {
    const draggedIdx = draggingImageIndexRef.current;
    if (draggedIdx === null || draggedIdx === targetImgIdx) return;
    setNews(p => {
      const c = [...p]; const imgs = [...(c[newsIdx].images || [])];
      const [draggedItem] = imgs.splice(draggedIdx, 1); imgs.splice(targetImgIdx, 0, draggedItem);
      c[newsIdx].images = imgs; return c;
    });
    draggingImageIndexRef.current = null;
  };

  const imageSrcFor = (item, name) => {
    const inLib = imageLibrary.find(a => a.name === name);
    return inLib ? inLib.url : `/news/${name}`;
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {/* 🎯 頂部控制列：手機版自動重組為舒適、大顆好按的圓潤 Pill 按鈕網格 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">📰 最新消息管理面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Mode: {isCloud ? "☁️ Cloudflare R2 Sync" : "💻 Local File Export"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <button className="px-4 py-2 rounded-full bg-black text-white text-xs font-medium shadow-sm hover:bg-gray-800 transition" onClick={addNews}>+ 新增快訊</button>
          <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition" onClick={copyJSON}>複製 JSON</button>
          
          {isCloud ? (
            <>
              <button className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-medium disabled:opacity-50" onClick={() => saveToCloud(false)} disabled={isSaving}>
                {isSaving ? "儲存中..." : "💾 僅儲存"}
              </button>
              <button className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-medium disabled:opacity-50 col-span-2 sm:col-span-1" onClick={() => saveToCloud(true)} disabled={isSaving}>
                {isSaving ? "發布中..." : "🚀 儲存並發布網站"}
              </button>
            </>
          ) : (
            <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium" onClick={exportJSON}>📥 下載 JSON</button>
          )}

          <label className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      {/* 雙欄主工作區：手機版單欄垂直排開，桌機維持黃金比例雙配欄 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側欄：暫存媒體櫃（手機版自動流向頂部，方便選取附加圖片） */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] lg:sticky lg:top-6">
            <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">🖼️ 新聞圖庫媒體櫃</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-gray-50 cursor-pointer hover:bg-gray-100/50 transition" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && onDropFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-gray-400 font-medium">拖曳圖片至此或點擊上傳圖檔</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onDropFiles(e.target.files)} />
            </div>
            
            {/* 圖庫快取九宮格 */}
            <div className="grid grid-cols-3 gap-2 mt-4 max-h-[240px] lg:max-h-[400px] overflow-y-auto pr-1 ">
              {imageLibrary.map(img => (
                <button 
                  key={img.id} 
                  type="button"
                  disabled={activeIndex === null}
                  className="border border-gray-100 rounded-xl overflow-hidden text-[10px] text-center bg-gray-50 hover:border-black transition disabled:opacity-40 p-1 space-y-1"
                  onClick={() => activeIndex !== null && attachImageToItem(activeIndex, img.name)}
                  title={activeIndex === null ? "請先在右側選取一則公告後再點選圖片附加" : "點擊將此圖加入該則公告相簿"}
                >
                  <img src={img.url} className="h-14 w-full object-cover rounded-lg" alt="" />
                  <div className="px-1 truncate font-mono text-[9px] text-gray-500">{img.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側欄：公告主清單與多語系編輯表單 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            <span className="text-sm font-bold text-gray-800 block border-b border-gray-100 pb-3 mb-4">
              公告快訊總計清冊 ({news.length})
            </span>
            
            <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1 ">
              {news.map((item, i) => {
                const isActive = activeIndex === i;
                
                return (
                  <div 
                    key={item.id} 
                    className={classNames(
                      "p-4 md:p-5 flex flex-col sm:flex-row gap-5 transition duration-200 border relative group rounded-2xl", 
                      isActive 
                        ? "bg-gray-50/50 border-black ring-1 ring-black/5" 
                        : "bg-white border-gray-100 hover:border-gray-300"
                    )} 
                    onClick={() => setActiveIndex(i)}
                  >
                    
                    {/* 左側微型封面快顯與移動排序控制 */}
                    <div className="w-full sm:w-20 shrink-0 flex sm:flex-col justify-between items-center sm:justify-start gap-3">
                      <div className="w-16 h-16 sm:w-full aspect-square bg-gray-50 rounded-xl border border-gray-100 overflow-hidden relative shadow-inner shrink-0">
                        {item.image ? (
                          <img src={imageSrcFor(item, item.image)} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="text-[10px] grid place-items-center h-full text-gray-400 select-none font-medium">無封面</div>
                        )}
                      </div>
                      <div className="flex flex-row sm:flex-row gap-1 text-center justify-center">
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg hover:bg-gray-50 shadow-xs font-mono font-bold" onClick={e => { e.stopPropagation(); moveNews(i, -1); }}>↑</button>
                        <button type="button" className="border border-gray-200 bg-white px-2.5 py-1 text-xs rounded-lg hover:bg-gray-50 shadow-xs font-mono font-bold" onClick={e => { e.stopPropagation(); moveNews(i, 1); }}>↓</button>
                      </div>
                    </div>

                    {/* 右側核心表單輸入欄位組 */}
                    <div className="flex-1 space-y-4" onClick={e => e.stopPropagation()}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">網址唯一識別碼 (ID / Slug)</span>
                          <div className="w-full bg-gray-100 px-3 py-2.5 rounded-xl text-xs font-mono font-bold text-gray-800 tracking-tight truncate border border-transparent">
                            🔗 {item.id}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">前台顯示日期 (Date String)</span>
                          <input className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-white focus:outline-none focus:border-black transition" value={item.date || ""} onChange={e => updateNews(i, { date: e.target.value })} placeholder="例如: October 13, 2025" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">圖片無障礙替代文字 (Alt)</span>
                        <input className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-white focus:outline-none focus:border-black transition" value={item.alt || ""} onChange={e => updateNews(i, { alt: e.target.value })} placeholder="例如: 2026 創作聯展快訊" />
                      </div>

                      {/* 消息公告標題多語系 */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">📢 公告標題 (Title)</span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex items-center gap-1.5 border border-gray-200 rounded-xl bg-white px-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase w-4 font-bold text-center">{l}</span>
                              <input className="w-full text-xs py-2 bg-transparent focus:outline-none" value={item.title?.[l] || ""} onChange={e => updateI18n(i, "title", l, e.target.value)} placeholder="請輸入消息標題..." />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 消息詳細內文多語系 */}
                      <div>
                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider mb-1.5">📝 詳細內文內容 (Content)</span>
                        <div className="space-y-2">
                          {["zh", "ja", "en"].map(l => (
                            <div key={l} className="flex gap-2 items-start bg-gray-50/50 border border-gray-100 rounded-xl p-2">
                              <span className="text-[9px] font-mono text-gray-400 uppercase font-bold w-5 text-center mt-2 shrink-0">{l}</span>
                              <textarea className="w-full text-xs bg-transparent focus:outline-none h-20 resize-y leading-relaxed" value={item.content?.[l] || ""} onChange={e => updateI18n(i, "content", l, e.target.value)} placeholder={`請輸入${l === "zh" ? "中文" : l === "ja" ? "日文" : "英文"}的最新公告完整內文...`} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 消息專屬相簿管理隊列 */}
                      <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/50 space-y-3">
                        <span className="block text-[11px] text-gray-700 font-bold">📸 已綁定消息相簿（滑鼠長按可直接「拖曳更換圖片前後順序」）</span>
                        
                        {item.images && item.images.length ? (
                          <div className="space-y-2">
                            {item.images.map((imgName, imgIdx) => (
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
                                  <img src={imageSrcFor(item, imgName)} className="w-8 h-8 rounded-lg object-cover border shrink-0" alt="" />
                                  <span className="truncate font-mono text-[11px] text-gray-600">{imgName}</span>
                                  {item.image === imgName && <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded-full font-sans font-medium">封面主圖</span>}
                                </div>
                                <div className="space-x-1 shrink-0 flex items-center">
                                  <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinItem(i, imgIdx, -1)}>↑</button>
                                  <button type="button" className="text-[10px] border bg-gray-50 px-1.5 py-1 rounded-lg text-gray-400 hover:bg-gray-100" onClick={() => moveImageWithinItem(i, imgIdx, 1)}>↓</button>
                                  <button type="button" className={classNames("text-[10px] px-2 py-1 border rounded-lg transition font-medium", item.image === imgName ? "bg-black text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")} onClick={() => updateNews(i, { image: imgName })}>設為封面</button>
                                  <button type="button" className="text-[10px] text-red-500 border border-red-100 px-2 py-1 rounded-lg bg-red-50/50 hover:bg-red-50" onClick={() => removeImageFromItem(i, imgName)}>移除</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic">此則公告目前相簿為空。請在左側媒體櫃上傳並附加圖片加入。</p>
                        )}
                      </div>
                    </div>

                    {/* 獨立刪除快訊按鈕 */}
                    <button type="button" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-full h-9 self-end sm:self-start shrink-0 font-medium mt-2 sm:mt-0" onClick={e => { e.stopPropagation(); removeNews(i); }}>
                      刪除消息
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