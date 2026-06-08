"use client";
import React, { useState, useEffect } from "react";

const emptyLangObject = () => ({
  bannerImages: ["1.jpg", "4.jpg", "2.jpg"],
  en: { title: "", content: "" },
  ja: { title: "", content: "" },
  zh: { title: "", content: "" }
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

export default function AboutPageBuilder({ isCloud, targetFile, pageTitle }) {
  const [data, setData] = useState(emptyLangObject());
  const [isSaving, setIsSaving] = useState(false);
  // 用來共享主控台傳過來或組件內部的媒體櫃狀態（選填，此處提供本機路徑防呆預覽）
  const [imageLibrary, setImageLibrary] = useState([]);

  // ☁️ 雲端初始化載入
  useEffect(() => {
    if (isCloud && targetFile) {
      fetch(`/admin/api/r2?file=${targetFile}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((cloudData) => {
          if (cloudData) {
            setData({
              bannerImages: Array.isArray(cloudData.bannerImages) ? cloudData.bannerImages : ["1.jpg", "4.jpg", "2.jpg"],
              en: cloudData.en || { title: "", content: "" },
              ja: cloudData.ja || { title: "", content: "" },
              zh: cloudData.zh || { title: "", content: "" },
            });
          }
        })
        .catch(() => console.log(`雲端尚未找到 ${targetFile}`));
    }
  }, [isCloud, targetFile]);

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
// 🎯 補上這段漏掉的 copyJSON 函式：
  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("JSON 內容已成功複製到剪貼簿！");
    } catch (err) {
      alert("複製失敗，請手動選取右側 JSON 複製");
    }
  };
  // 🎯 智慧縮圖路徑計算：如果是本機舊圖吃 /about/，如果有上線吃 R2
  const previewSrcFor = (name) => {
    if (!name) return "";
    // 如果圖片存在於暫存媒體櫃中，吃 Blob URL
    const inLib = imageLibrary.find(a => a.name === name);
    if (inLib) return inLib.url;
    
    // 預設防呆：對齊首頁背景圖本地路徑 /about/1.jpg
    return `/about/${name}`;
  };

  const saveToCloud = async (shouldDeploy = true) => {
    setIsSaving(true);
    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: targetFile, data, deploy: shouldDeploy }),
      });
      const resData = await res.json();
      if (res.ok) {
        alert(shouldDeploy ? `🎉 ${pageTitle}資料已儲存並啟動自動部署打包！` : `💾 ${pageTitle}資料已同步至 R2 (暫不發布)。`);
      } else {
        alert(`儲存失敗: ${resData.error}`);
      }
    } catch {
      alert("連線 API 失敗");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="text-slate-900 p-8 bg-slate-50 min-h-screen flex flex-col">
      <header className="flex items-center justify-between border-b pb-4 mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{pageTitle} 頁面管理面板</h2>
          <p className="text-xs text-slate-500 mt-1">目前目標檔案：<code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono text-xs">{targetFile}</code></p>
        </div>
        <div className="flex items-center gap-2">
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
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm" onClick={exportJSON}>📥 下載 {targetFile}</button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 overflow-hidden">
        
        {/* 左側 3/5 編輯區 */}
        <div className="lg:col-span-3 space-y-6 max-h-[800px] overflow-y-auto pr-1">
          
          {/* 🎯 背景圖片管理區（含即時縮圖預覽） */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm bg-blue-600 text-white px-2 py-0.5 rounded font-mono uppercase font-bold text-xs">Images</span>
                <h3 className="font-bold text-slate-700 text-sm">中段背景輪播圖組 (MessageGallery Images)</h3>
              </div>
              <button 
                type="button" 
                className="text-xs bg-slate-900 text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 transition"
                onClick={addImageField}
              >
                + 新增圖片
              </button>
            </div>

            <div className="space-y-3">
              {(data.bannerImages || []).map((imgName, idx) => {
                const imgSrc = previewSrcFor(imgName);
                return (
                  <div key={idx} className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    
                    {/* 📸 這裡就是新增的即時縮圖預覽區塊 */}
                    <div className="w-16 h-16 bg-slate-200 rounded-lg border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative group">
                      {imgName ? (
                        <img 
                          src={imgSrc} 
                          className="w-full h-full object-cover" 
                          alt="Preview" 
                          onError={(e) => {
                            // 如果檔名打錯找不到圖，自動顯示防呆破碎圖示
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">無檔名</span>
                      )}
                    </div>

                    {/* 輸入框與移除按鈕 */}
                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 block font-bold">IMAGE FILENAME {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          className="flex-1 border rounded-xl text-xs p-2 bg-white font-mono focus:outline-none transition"
                          value={imgName || ""}
                          onChange={(e) => handleImageNameChange(idx, e.target.value)}
                          placeholder="例如: 1.jpg"
                        />
                        <button 
                          type="button"
                          className="text-xs border border-red-200 text-red-500 px-3 py-2 rounded-xl bg-white hover:bg-red-50 transition shrink-0"
                          onClick={() => removeImageField(idx)}
                        >
                          移除
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
              {(!data.bannerImages || data.bannerImages.length === 0) && (
                <p className="text-xs text-slate-400 italic">目前無背景圖片，請點擊上方按鈕新增。</p>
              )}
            </div>
          </div>

          {/* 三語系文字表單 */}
          {[
            { key: "zh", name: "繁體中文 (Traditional Chinese)" },
            { key: "ja", name: "日本語 (Japanese)" },
            { key: "en", name: "英語 (English)" }
          ].map((lang) => (
            <div key={lang.key} className="bg-white border rounded-2xl p-6 shadow-sm border-slate-200 space-y-4">
              <div className="flex items-center gap-2 border-b pb-2">
                <span className="text-sm bg-slate-900 text-white px-2 py-0.5 rounded font-mono uppercase font-bold text-xs">{lang.key}</span>
                <h3 className="font-bold text-slate-700 text-sm">{lang.name}</h3>
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">分區標題 (Title)</label>
                <input 
                  type="text"
                  className="w-full border rounded-xl text-sm p-2.5 bg-slate-50 focus:bg-white focus:outline-none"
                  value={data[lang.key]?.title || ""}
                  onChange={(e) => handleChange(lang.key, "title", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 font-bold uppercase mb-1">詳細內容內文 (Content)</label>
                <textarea 
                  className="w-full border rounded-xl text-sm p-3 bg-slate-50 h-40 resize-y focus:bg-white focus:outline-none leading-relaxed"
                  value={data[lang.key]?.content || ""}
                  onChange={(e) => handleChange(lang.key, "content", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 右側 2/5 JSON 預覽 */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden max-h-[800px]">
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold font-mono text-slate-400 tracking-wider uppercase">📄 Live JSON Preview</span>
          </div>
          <pre className="p-4 overflow-auto font-mono text-xs text-emerald-400 leading-relaxed flex-1 select-all">
            <code>{JSON.stringify(data, null, 2)}</code>
          </pre>
        </div>

      </div>
    </div>
  );
}