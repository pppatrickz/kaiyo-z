/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

// 初始化單張輪播圖的多語系結構，精準對齊您的 title 與 desc 欄位
const emptyI18n = () => ({
  en: "",
  ja: "",
  zh: ""
});

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
  // 🎯 需求：讀入列表後預設直接展開第 0 個（第一張圖）
  const [activeIndex, setActiveIndex] = useState(0); 
  
  const [imageLibrary, setImageLibrary] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  // 用於圖片拖曳排序
  const draggingIndexRef = useRef(null);

  // ☁️ 初始化載入雲端 carousel.json
  useEffect(() => {
    if (isCloud) {
      fetch("/admin/api/r2?file=carousel.json")
        .then((res) => res.ok ? res.json() : null)
        .then((cloudData) => {
          if (Array.isArray(cloudData)) {
            // 精準映射您的 JSON 格式，並提供防空保護
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
            // 🚀 讀入列表後，第一張圖預設是點開狀態
            if (formatted.length > 0) {
              setActiveIndex(0);
            }
          }
        })
        .catch(() => console.log("雲端尚未找到 carousel.json"));
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
        alert(shouldDeploy ? "🎉 輪播資料已同步至 R2，自動打包部署已觸發！" : "💾 輪播資料已儲存至 R2（暫不發布）。");
      } else {
        alert(`錯誤: ${resData.error}`);
      }
    } catch {
      alert("連線雲端失敗");
    } finally { setIsSaving(false); }
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify(slides, null, 2), "carousel.json", "application/json");
  };

  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(slides, null, 2));
    alert("JSON 已複製到剪貼簿");
  };

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
        // 🚀 本地匯入列表後，第一張圖同樣預設點開
        if (formatted.length > 0) {
          setActiveIndex(0);
        }
      } else {
        throw new Error("格式錯誤：carousel.json 必須是一個 JSON 陣列結構");
      }
    } catch (e) { alert("匯入失敗：" + e.message); }
  };

  // ---------- 輪播圖管理 CRUD ----------
  const addSlideFromLibrary = (imgName) => {
    const newSlide = {
      image: imgName,
      title: emptyI18n(),
      desc: emptyI18n()
    };
    setSlides(prev => {
      const nextSlides = [...prev, newSlide];
      setActiveIndex(nextSlides.length - 1); // 新增後聚焦在最後一張
      return nextSlides;
    });
  };

  const removeSlide = (idx) => {
    if (!confirm("確定要移除這張輪播圖嗎？")) return;
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

  // ---------- 暫存圖片庫處理 ----------
  const onDropFiles = (files) => {
    const newAssets = [];
    Array.from(files).forEach((f) => {
      const id = `${f.name}-${f.size}`;
      if (!imageLibrary.some(a => a.id === id)) newAssets.push({ id, name: f.name, url: URL.createObjectURL(f) });
    });
    if (newAssets.length) setImageLibrary(lib => [...lib, ...newAssets]);
  };

  // ---------- HTML5 拖曳排序邏輯 ----------
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
    <div className="text-slate-900 p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Carousel 輪播圖與多語系控制面板</h2>
          <p className="text-xs text-slate-500 mt-1">目前模式：{isCloud ? "☁️ R2 雲端同步" : "💻 本地檔案輸出"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-white border text-sm" onClick={copyJSON}>複製 JSON</button>
          
          {isCloud ? (
            <>
              <button className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-sm disabled:opacity-50" onClick={() => saveToCloud(false)} disabled={isSaving}>
                {isSaving ? "儲存中..." : "💾 僅儲存 (不發布)"}
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm disabled:opacity-50" onClick={() => saveToCloud(true)} disabled={isSaving}>
                {isSaving ? "發布中..." : "🚀 儲存並發布網站"}
              </button>
            </>
          ) : (
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm" onClick={exportJSON}>
              📥 下載 carousel.json
            </button>
          )}

          <label className="px-3 py-1.5 rounded-lg bg-white border text-sm cursor-pointer">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側 1/3：暫存媒體櫃（上傳首頁大圖） */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border p-4 shadow-sm">
            <h3 className="font-semibold text-slate-700 mb-1 text-sm">① 上傳輪播大圖至媒體櫃</h3>
            <p className="text-[11px] text-slate-400 mb-3">上傳後「點擊圖片」即可直接新增一張幻燈片</p>
            
            <div className="border-2 border-dashed rounded-xl p-4 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && onDropFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-slate-400">拖曳圖片至此或點選</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onDropFiles(e.target.files)} />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 max-h-[400px] overflow-y-auto">
              {imageLibrary.map(img => (
                <button 
                  key={img.id} 
                  type="button"
                  className="border rounded-xl overflow-hidden text-[10px] text-center bg-slate-50 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/10 transition group text-left"
                  onClick={() => addSlideFromLibrary(img.name)}
                >
                  <img src={img.url} className="h-20 w-full object-cover" alt="" />
                  <div className="p-1.5 truncate text-slate-600 group-hover:text-blue-600 font-mono text-[10px]">{img.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側 2/3：幻燈片隊列與拖曳排序 / 多國語言編輯 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-500 mb-3">② 輪播隊列管理（滑鼠「直接按住拖曳」可排序）</h3>
            
            {slides.length === 0 ? (
              <div className="text-center p-12 border rounded-xl border-dashed bg-slate-50 text-slate-400 text-sm">
                目前沒有任何輪播圖。請先從左側媒體櫃點擊圖片加入！
              </div>
            ) : (
              <div className="space-y-3">
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
                        "border rounded-xl p-4 transition shadow-sm bg-white cursor-grab active:cursor-grabbing border-slate-200",
                        isActive ? "ring-2 ring-blue-500 bg-blue-50/10 border-transparent" : "hover:bg-slate-50"
                      )}
                    >
                      {/* 上半部：拖曳橫條與縮圖、刪除按鈕 */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-center gap-3 truncate pointer-events-none">
                          <span className="text-slate-300 font-bold select-none text-sm shrink-0">☰</span>
                          <img src={imageSrcFor(slide.image)} className="w-24 h-14 rounded-lg object-cover border shadow-sm shrink-0" alt="" />
                          <div className="truncate">
                            <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">第 {idx + 1} 張</span>
                            <div className="text-xs font-mono text-slate-500 mt-1 truncate">{slide.image}</div>
                          </div>
                        </div>
                        <button type="button" className="text-xs text-red-500 border border-red-100 px-2.5 py-1 rounded-lg bg-red-50/50 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); removeSlide(idx); }}>移除</button>
                      </div>

                      {/* 下半部：展開的獨立多國語言標題（title）與說明（desc） */}
                      {isActive && (
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4" onClick={e => e.stopPropagation()}>
                          {[
                            { key: "zh", label: "中文 (zh)" },
                            { key: "ja", label: "日文 (ja)" },
                            { key: "en", label: "英文 (en)" }
                          ].map((l) => (
                            <div key={l.key} className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 space-y-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] bg-slate-700 text-white font-mono px-1.5 rounded uppercase font-bold scale-90">{l.key}</span>
                                <span className="text-xs text-slate-500 font-semibold">{l.label} 對應欄位</span>
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">TITLE</span>
                                  <input 
                                    type="text" 
                                    className="w-full border rounded-lg text-xs p-2 bg-white"
                                    value={slide.title?.[l.key] || ""}
                                    onChange={e => updateSlideField(idx, "title", l.key, e.target.value)}
                                    placeholder="請輸入此圖片的輪播標題..."
                                  />
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-400 font-bold block mb-0.5">DESC</span>
                                  <textarea 
                                    className="w-full border rounded-lg text-xs p-2 bg-white h-16 resize-y"
                                    value={slide.desc?.[l.key] || ""}
                                    onChange={e => updateSlideField(idx, "desc", l.key, e.target.value)}
                                    placeholder="請輸入此圖片的輪播說明內文..."
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