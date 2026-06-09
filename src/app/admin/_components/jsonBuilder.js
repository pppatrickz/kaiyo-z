/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useRef, useState, useCallback } from "react";
import { useAdminModule, getImageSrc } from "../_hooks/useAdminModule"; // 🎯 引入全能模組 Hook

const emptyLangObject = () => ({
  bannerImages: ["1.jpg", "4.jpg", "2.jpg"],
  en: { title: "", content: "" },
  ja: { title: "", content: "" },
  zh: { title: "", content: "" }
});

function classNames(...xs) { return xs.filter(Boolean).join(" "); }

export default function AboutPageBuilder({ isCloud, targetFile, pageTitle }) {
  const fileInputRef = useRef(null);

  // 🎯 1. 關於我專屬：從關於我物件中抽取所有圖片檔名的規則（即抽取 bannerImages 陣列）
  const extractImagesFn = useCallback((parsedObj) => {
    if (!parsedObj || !Array.isArray(parsedObj.bannerImages)) return [];
    return parsedObj.bannerImages.filter(Boolean);
  }, []);

  // 🎯 2. 關於我專屬：資料結構清洗與安全防護
  const sanitizeAndSyncAbout = useCallback((parsed) => {
    if (!parsed) return emptyLangObject();
    return {
      bannerImages: Array.isArray(parsed.bannerImages) ? parsed.bannerImages : ["1.jpg", "4.jpg", "2.jpg"],
      en: { title: parsed.en?.title || "", content: parsed.en?.content || "" },
      ja: { title: parsed.ja?.title || "", content: parsed.ja?.content || "" },
      zh: { title: parsed.zh?.title || "", content: parsed.zh?.content || "" }
    };
  }, []);

  // 🎯 3. 接軌全能智慧 Hook，完美掌控關於我模組生命週期
  const {
    jsonData: data,
    setJsonData: setData,
    isSaving,
    existingImages,
    pendingImages,
    isLibraryLoaded,
    loadExistingImages,
    addPendingFiles,
    saveModuleChanges
  } = useAdminModule({
    moduleType: "about",
    fileName: targetFile || "about.json",
    sanitizeFn: sanitizeAndSyncAbout,
    extractImagesFn
  });

  // 非同步抓取文字 JSON 緩衝畫面
  if (!data) {
    return <div className="p-8 text-center text-xs text-gray-400 font-mono tracking-wider animate-pulse">撈取關於我核心 JSON 中...</div>;
  }

  // ----- 快捷按鈕與本地 JSON 下載工具 -----
  const handleSave = () => saveModuleChanges(data, true);
  const handleSaveNoDeploy = () => saveModuleChanges(data, false);
  const handleCopyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("JSON 內容已成功複製到剪貼簿！");
    } catch (err) { alert("複製失敗"); }
  };
  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = targetFile || "about.json"; a.click(); URL.revokeObjectURL(url);
  };
  const handleImportJSON = async (file) => {
    try {
      const text = await file.text(); const parsed = JSON.parse(text);
      if (!parsed.zh && !parsed.en && !parsed.ja) throw new Error("格式不符：最外層必須包含 zh/en/ja 語系根節點。");
      setData(sanitizeAndSyncAbout(parsed));
      alert("🎉 成功讀入本地 JSON 結構！");
    } catch (e) { alert(`匯入錯誤: ${e.message}`); }
  };

  // ----- 表單文字輸入變更同步 -----
  const handleChange = (lang, field, value) => {
    setData((prev) => ({
      ...prev,
      [lang]: { ...prev[lang], [field]: value }
    }));
  };

  const handleImageNameChange = (index, value) => {
    setData((prev) => {
      const updatedImages = [...(prev.bannerImages || [])];
      updatedImages[index] = value;
      return { ...prev, bannerImages: updatedImages };
    });
  };

  const addImageField = () => {
    setData((prev) => ({
      ...prev,
      bannerImages: [...(prev.bannerImages || []), ""]
    }));
  };

  const removeImageField = (index) => {
    setData((prev) => ({
      ...prev,
      bannerImages: (prev.bannerImages || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col">
      
      {/* 頂部 Pill 控制列 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{pageTitle} 頁面管理面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            目標檔案：<code className="bg-gray-200/60 text-gray-700 px-2 py-0.5 rounded font-mono text-xs">{targetFile}</code>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
          <button className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 hover:bg-gray-50 transition" onClick={handleCopyJSON}>複製 JSON</button>
          {isCloud ? (
            <>
              <button className="px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-medium disabled:opacity-50" onClick={handleSaveNoDeploy} disabled={isSaving}>💾 僅儲存</button>
              <button className="px-4 py-2 rounded-full bg-green-600 text-white text-xs font-medium disabled:opacity-50 col-span-2 sm:col-span-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "上傳同步中..." : "🚀 儲存並發布網站"}
              </button>
            </>
          ) : (
            <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium text-center" onClick={handleDownloadJSON}>📥 下載 JSON</button>
          )}
          <label className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImportJSON(e.target.files[0])} />
          </label>
        </div>
      </header>

      {/* 主編輯網格版面 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 overflow-hidden">
        
        {/* 左側欄位 3/5：核心控制表單與智慧媒體櫃 */}
        <div className="lg:col-span-3 space-y-6 max-h-[850px] lg:overflow-y-auto lg:pr-2">
          
          {/* 背景圖片群組管理區 */}
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold">Images</span>
                <h3 className="font-bold text-gray-800 text-sm">中段背景輪播圖組</h3>
                {pendingImages.length > 0 && <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-sans animate-pulse">{pendingImages.length} 待上傳</span>}
              </div>
              <button type="button" className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition shadow-sm font-medium" onClick={addImageField}>+ 新增圖片</button>
            </div>

            {/* 🎯 智慧媒體檔案拖曳接收區 */}
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && addPendingFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-gray-400 font-medium">拖曳新背景圖至此或點擊選取（自動綁定上傳）</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && addPendingFiles(e.target.files)} />
            </div>

            {/* 🌟 流量防線：控制是否渲染已存在的圖片預覽 */}
            {!isLibraryLoaded ? (
              <div className="p-4 text-center border border-gray-100 bg-gray-50/30 rounded-xl space-y-2">
                <p className="text-[11px] text-gray-400 leading-relaxed">預設不加載現有 R2 快取圖片。若需要確認圖片路徑與預覽，請解鎖載入。</p>
                <button type="button" className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-medium shadow-xs hover:bg-gray-800 transition" onClick={loadExistingImages}>
                  🔍 載入目前現有圖片庫
                </button>
              </div>
            ) : (
              /* 智慧分流九宮格預覽 */
              <div className="bg-gray-50/40 border border-gray-100/80 p-3 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider block uppercase">🌐 目前已被使用的現有圖片檔名一覽 ({existingImages.length})</span>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map(img => (
                    <code key={img} className="bg-white border border-gray-200/60 text-gray-700 px-2 py-1 rounded-lg font-mono text-[11px] font-bold shadow-xs">📄 {img}</code>
                  ))}
                </div>
              </div>
            )}

            {/* 圖片輸入控制列 */}
            <div className="space-y-3">
              {(data.bannerImages || []).map((imgName, idx) => {
                const imgBlob = pendingImages.find(p => p.name === imgName)?.url;
                const imgSrc = getImageSrc({ type: "about", fileName: imgName, blobUrl: imgBlob });

                return (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/70">
                    <div className="w-16 h-16 bg-gray-200/60 rounded-xl border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                      {imgName ? (
                        <img src={imgSrc} className="w-full h-full object-cover" alt="Preview" onError={(e) => { e.target.style.opacity = '0.4'; }} />
                      ) : <span className="text-[10px] text-gray-400 font-medium">無檔名</span>}
                    </div>

                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-gray-400 block font-bold tracking-wider flex items-center gap-1.5">
                        IMAGE FILENAME {idx + 1}
                        {imgBlob && <span className="text-[7px] bg-amber-500 text-white px-1 py-0.2 rounded-sm font-sans normal-case">Pending</span>}
                      </span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" className="flex-1 border border-gray-200 rounded-xl text-xs p-2 bg-white font-mono focus:outline-none focus:border-black transition"
                          value={imgName || ""} onChange={(e) => handleImageNameChange(idx, e.target.value)} placeholder="例如: profile.jpg"
                        />
                        <button type="button" className="text-xs border border-red-100 text-red-500 px-3 py-2 rounded-xl bg-white hover:bg-red-50 transition shrink-0 font-medium" onClick={() => removeImageField(idx)}>移除</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {(!data.bannerImages || data.bannerImages.length === 0) && (
                <p className="text-xs text-gray-400 italic text-center py-4">目前無背景圖片，請點擊右上方按鈕新增。</p>
              )}
            </div>
          </div>

          {/* 三語系自我介紹文字表單 */}
          {[
            { key: "zh", name: "繁體中文 (Traditional Chinese)" },
            { key: "ja", name: "日本語 (Japanese)" },
            { key: "en", name: "英語 (English)" }
          ].map((lang) => (
            <div key={lang.key} className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)] space-y-4">
              <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                <span className="text-[10px] bg-gray-900 text-white font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider">{lang.key}</span>
                <h3 className="font-bold text-gray-800 text-sm">{lang.name}</h3>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">自我介紹區標題 (Title)</label>
                <input 
                  type="text" className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition"
                  value={data[lang.key]?.title || ""} onChange={(e) => handleChange(lang.key, "title", e.target.value)} placeholder="請輸入大標題..."
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">核心介紹詳細內文 (Content)</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl text-xs p-3 bg-gray-50/50 h-44 resize-y focus:bg-white focus:outline-none focus:border-black transition leading-relaxed"
                  value={data[lang.key]?.content || ""} onChange={(e) => handleChange(lang.key, "content", e.target.value)} placeholder="請輸入關於自我介紹的完整故事..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* 右側欄位 2/5：JSON 即時渲染預覽（唯讀） */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900 rounded-[24px] border border-slate-800 shadow-xl overflow-hidden max-h-[400px] lg:max-h-[850px] mt-4 lg:mt-0">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold font-mono text-slate-400 tracking-wider uppercase">📄 Live JSON Preview</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono font-medium">Read Only</span>
          </div>
          <pre className="p-4 overflow-auto font-mono text-xs text-emerald-400 leading-relaxed flex-1 select-all selection:bg-slate-800">
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        </div>

      </div>
    </div>
  );
}