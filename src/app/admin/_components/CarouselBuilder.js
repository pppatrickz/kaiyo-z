/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

// 初始化單張輪播圖的多語系結構，精準對齊您的 title 與 desc 欄位
const emptyI18n = () => ({
  en: "",
  ja: "",
  zh: ""
});

// 在本地環境下，安全地進行 JSON 檔案導出與下載
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

export default function CarouselBuilder({ isCloud }) {
  // 輪播核心：直接使用您最原始的陣列結構
  const [slides, setSlides] = useState([]);
  // 🎯 讀入列表後預設直接展開第 0 個（第一張圖）
  const [activeIndex, setActiveIndex] = useState(0); 
  
  const [imageLibrary, setImageLibrary] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  // 用于滑鼠拖曳排序的索引指標
  const draggingIndexRef = useRef(null);

  // ☁️ 初始化載入雲端 R2 的 carousel.json 檔案
  useEffect(() => {
    if (isCloud) {
      fetch("/admin/api/r2?file=carousel.json")
        .then((res) => res.ok ? res.json() : null)
        .then((cloudData) => {
          if (Array.isArray(cloudData)) {
            // 精準對齊您的 JSON 欄位格式，並提供完整的結構防護
            const formatted = cloudData.map(s => ({
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
            setSlides(formatted);
            // 🚀 讀入列表後，預設展開第一張圖片的編輯表單
            if (formatted.length > 0) {
              setActiveIndex(0);
            }
          }
        })
        .catch(() => console.log("雲端儲存桶內尚未找到 carousel.json"));
    }
  }, [isCloud]);

  // ☁️ 儲存至雲端（維持一模一樣的原生純陣列 JSON 結構輸出）
  const saveToCloud = async (shouldDeploy = true) => {
    setIsSaving(true);
    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: "carousel.json", data: slides, deploy: shouldDeploy }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert(shouldDeploy ? "🎉 輪播資料已成功寫入 R2 雲端，自動打包部署已同步觸發！" : "💾 輪播資料已儲存至 R2（暫不發布網站更新）。");
      } else {
        alert(`同步失敗: ${resData.error}`);
      }
    } catch {
      alert("連線雲端 API 失敗，請檢查網路狀態或環境變數。");
    } finally { setIsSaving(false); }
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify(slides, null, 2), "carousel.json", "application/json");
  };

  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(slides, null, 2));
    alert("輪播 JSON 結構內容已成功複製至剪貼簿！");
  };

  // 本地端檔案匯入處理
  const importFromFile = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        const formatted = parsed.map(s => ({
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
        setSlides(formatted);
        // 🚀 本地匯入成功後，同樣預設展開第一張圖片
        if (formatted.length > 0) {
          setActiveIndex(0);
        }
      } else {
        throw new Error("格式不合：carousel.json 最外層結構必須是一個 JSON 陣列。");
      }
    } catch (e) { alert("匯入失敗：" + e.message); }
  };

  // ---------- 輪播圖管理 CRUD 操作區 ----------
  const addSlideFromLibrary = (imgName) => {
    const newSlide = {
      image: imgName,
      title: emptyI18n(),
      desc: emptyI18n()
    };
    setSlides(prev => {
      const nextSlides = [...prev, newSlide];
      setActiveIndex(nextSlides.length - 1); // 新增完成後自動聚焦展開最後一張
      return nextSlides;
    });
  };

  const removeSlide = (idx) => {
    if (!confirm("確定要將這張圖片從首頁輪播隊列中移除嗎？")) return;
    setSlides(prev => prev.filter((_, i) => i !== idx));
    setActiveIndex(null);
  };

  // 更新精準對齊層級的輸入框數值：slides[index][title/desc][lang]
  const updateSlideField = (slideIdx, section, lang, value) => {
    setSlides(prev => {
      const copy = [...prev];
      copy[slideIdx] = {
        ...copy[slideIdx],
        [section]: {
          ...copy[slideIdx][section],
          [lang]: value
        }
      };
      return copy;
    });
  };

  // ---------- 媒體櫃圖檔上傳與暫存處理 ----------
  const onDropFiles = (files) => {
    const newAssets = [];
    Array.from(files).forEach((f) => {
      const id = `${f.name}-${f.size}`;
      if (!imageLibrary.some(a => a.id === id)) newAssets.push({ id, name: f.name, url: URL.createObjectURL(f) });
    });
    if (newAssets.length) setImageLibrary(lib => [...lib, ...newAssets]);
  };

  // ---------- HTML5 滑鼠長按拖曳排序邏輯 ----------
  const handleDragStart = (idx) => { draggingIndexRef.current = idx; };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (targetIdx) => {
    const draggedIdx = draggingIndexRef.current;
    if (draggedIdx === null || draggedIdx === targetIdx) return;

    setSlides(prev => {
      const next = [...prev];
      const [draggedItem] = next.splice(draggedIdx, 1);
      next.splice(targetIdx, 0, draggedItem);
      return next;
    });
    setActiveIndex(targetIdx);
    draggingIndexRef.current = null;
  };

  const imageSrcFor = (name) => {
    const inLib = imageLibrary.find(a => a.name === name);
    return inLib ? inLib.url : `/carousel/${name}`;
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen">
      
      {/* 🎯 頂部控制列：手機版自動重組為寬敞、好觸控的圓潤 Pill 按鈕網格 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Carousel 輪播圖與多語系控制面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Mode: {isCloud ? "☁️ Cloudflare R2 Sync" : "💻 Local File Export"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
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
            <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium" onClick={exportJSON}>
              📥 下載 carousel.json
            </button>
          )}

          <label className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      {/* 主編輯區：手機版單欄垂直流動，桌機維持三欄黃金配比 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 左側欄位 1/3：暫存媒體櫃（手機自動流向最上方，大幅提高上傳與點選的順暢度） */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-[20px] border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
            <h3 className="font-bold text-sm text-gray-800 mb-1 flex items-center gap-2">① 上傳輪播大圖至媒體櫃</h3>
            <p className="text-[11px] text-gray-400 mb-4">上傳完成後，「點擊圖片」即可快速新增一條輪播主圖</p>
            
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center bg-gray-50 cursor-pointer hover:bg-gray-100/50 transition" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && onDropFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-gray-400 font-medium">拖曳圖片至此區塊或點選上傳</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onDropFiles(e.target.files)} />
            </div>

            {/* 圖庫九宮格 */}
            <div className="grid grid-cols-2 gap-2 mt-4 max-h-[240px] lg:max-h-[500px] overflow-y-auto pr-1 ">
              {imageLibrary.map(img => (
                <button 
                  key={img.id} 
                  type="button"
                  className="border border-gray-100 rounded-xl overflow-hidden text-[10px] text-left bg-gray-50 hover:border-black transition group p-1 space-y-1.5"
                  onClick={() => addSlideFromLibrary(img.name)}
                  title="點擊此圖加入大首頁輪播隊列"
                >
                  <img src={img.url} className="h-20 w-full object-cover rounded-lg" alt="" />
                  <div className="p-1 truncate text-gray-500 group-hover:text-black font-mono text-[10px]">{img.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側欄位 2/3：幻燈片隊列與拖曳排序 / 多國語言編輯區 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)]">
            <h3 className="text-sm font-bold text-gray-800 mb-4 pb-2 border-b border-gray-50">
              ② 輪播隊列管理（滑鼠按住左側三條線可「直接托曳調整順序」）
            </h3>
            
            {slides.length === 0 ? (
              <div className="text-center p-12 border border-gray-100 border-dashed bg-gray-50 rounded-2xl text-gray-400 text-sm italic">
                目前首頁輪播清單為空。請先由左側媒體櫃上傳並點選圖片加入！
              </div>
            ) : (
              <div className="space-y-4 max-h-[850px] overflow-y-auto pr-1 ">
                {slides.map((slide, idx) => {
                  const isActive = activeIndex === idx;
                  return (
                    <div 
                      key={`${slide.image}-${idx}`}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(idx)}
                      onClick={() => setActiveIndex(idx)}
                      className={classNames(
                        "border p-4 transition duration-200 rounded-2xl flex flex-col gap-4 relative",
                        isActive 
                          ? "bg-gray-50/50 border-black ring-1 ring-black/5 shadow-xs" 
                          : "bg-white border-gray-100 hover:border-gray-300 cursor-pointer"
                      )}
                    >
                      {/* 上半部：排序標記、縮圖細節與移除按鈕 */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 truncate pointer-events-none">
                          <span className="text-gray-300 font-bold select-none text-base shrink-0 px-1">☰</span>
                          <img src={imageSrcFor(slide.image)} className="w-24 h-14 rounded-lg border border-gray-100 object-cover shadow-xs shrink-0" alt="" />
                          <div className="truncate">
                            <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-medium tracking-wide">
                              Slide {idx + 1}
                            </span>
                            <div className="text-xs font-mono text-gray-500 mt-1.5 truncate">{slide.image}</div>
                          </div>
                        </div>
                        <button type="button" className="text-xs text-red-500 border border-red-100 px-3 py-1.5 rounded-full bg-red-50/50 hover:bg-red-50 transition shrink-0 font-medium" onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}>移除</button>
                      </div>

                      {/* 下半部：目前選定項目展開的獨立多國語言表單 (TITLE & DESC) */}
                      {isActive && (
                        <div className="pt-4 border-t border-gray-100 space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
                          {[
                            { key: "zh", label: "繁體中文 (Traditional Chinese)" },
                            { key: "ja", label: "日本語 (Japanese)" },
                            { key: "en", label: "英語 (English)" }
                          ].map((l) => (
                            <div key={l.key} className="bg-white p-3.5 rounded-xl border border-gray-100 space-y-3 shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] bg-gray-900 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">{l.key}</span>
                                <span className="text-xs text-gray-700 font-bold">{l.label}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">輪播大標題 (Title)</span>
                                  <input 
                                    type="text" 
                                    className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition"
                                    value={slide.title?.[l.key] || ""}
                                    onChange={e => updateSlideField(idx, "title", l.key, e.target.value)}
                                    placeholder="請輸入展演標題字串..."
                                  />
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">副標說明內文 (Description)</span>
                                  <textarea 
                                    className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition h-16 resize-y leading-relaxed"
                                    value={slide.desc?.[l.key] || ""}
                                    onChange={e => updateSlideField(idx, "desc", l.key, e.target.value)}
                                    placeholder="請輸入關於該影像的作品敘述或理念說明..."
                                  />
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
    </div>
  );
}