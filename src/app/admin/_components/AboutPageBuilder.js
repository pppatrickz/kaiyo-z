"use client";
import React, { useState, useEffect } from "react";

// 精準對齊您最原始的 JSON 資料結構
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
  const [imageLibrary, setImageLibrary] = useState([]);

  // 🎯 核心清洗函式：確保不管是從雲端下載還是本地匯入，結構都完美對齊您的 "title" 與 "content"
  const sanitizeAndSyncAbout = (parsed) => {
    if (!parsed) return emptyLangObject();
    return {
      bannerImages: Array.isArray(parsed.bannerImages) ? parsed.bannerImages : ["1.jpg", "4.jpg", "2.jpg"],
      en: {
        title: parsed.en?.title || "",
        content: parsed.en?.content || "" // 🌟 精準對齊您的 content 欄位，不再漏掉內文！
      },
      ja: {
        title: parsed.ja?.title || "",
        content: parsed.ja?.content || ""
      },
      zh: {
        title: parsed.zh?.title || "",
        content: parsed.zh?.content || ""
      }
    };
  };

  // ☁️ 雲端初始化載入
  useEffect(() => {
    if (isCloud && targetFile) {
      fetch(`/admin/api/r2?file=${targetFile}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((cloudData) => {
          if (cloudData) {
            setData(sanitizeAndSyncAbout(cloudData)); // 🌟 載入時清洗並塞入狀態
          }
        })
        .catch(() => console.log(`雲端尚未找到 ${targetFile}`));
    }
  }, [isCloud, targetFile]);

  // 更新指定語系的指定欄位 (title 或 content)
  const handleChange = (lang, field, value) => {
    setData((prev) => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value
      }
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

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("JSON 內容已成功複製到剪貼簿！");
    } catch (err) {
      alert("複製失敗，請手動選取右側 JSON 複製");
    }
  };

  // 🎯 核心修正：補上之前漏掉的本地端 JSON 檔案匯入處理
  const importFromFile = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.zh && !parsed.en && !parsed.ja) {
        throw new Error("格式不符：about.json 最外層必須包含 zh/en/ja 語系根節點。");
      }
      
      const cleanData = sanitizeAndSyncAbout(parsed); // 🌟 清洗結構
      setData(cleanData);
      alert("🎉 成功讀入本地 about.json！可以開始編輯或發布。");
    } catch (e) {
      alert(`匯入錯誤: ${e.message}`);
    }
  };

  const previewSrcFor = (name) => {
    if (!name) return "";
    const inLib = imageLibrary.find(a => a.name === name);
    if (inLib) return inLib.url;
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

  const exportJSON = () => {
    downloadBlob(JSON.stringify(data, null, 2), targetFile, "application/json");
  };

  return (
    <div className="text-gray-900 p-4 md:p-8 bg-slate-50 min-h-screen flex flex-col">
      
      {/* 頂部控制列 */}
      <header className="flex flex-col gap-4 border-b border-gray-200 pb-5 mb-6 md:flex-row md:items-center md:justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{pageTitle} 頁面管理面板</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            目標檔案：<code className="bg-gray-200/60 text-gray-700 px-2 py-0.5 rounded font-mono text-xs">{targetFile}</code>
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
            <button className="px-4 py-2 rounded-full bg-blue-600 text-white text-xs font-medium text-center" onClick={exportJSON}>📥 下載 JSON</button>
          )}

          {/* 🎯 核心補回：匯入 JSON 按鈕（Pill 風格） */}
          <label className="px-4 py-2 rounded-full bg-white border border-gray-200 text-xs text-gray-700 text-center cursor-pointer hover:bg-gray-50 transition col-span-2 sm:col-span-1">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      {/* 主編輯區 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-1 overflow-hidden">
        
        {/* 左側欄位 3/5 */}
        <div className="lg:col-span-3 space-y-6 max-h-[850px] lg:overflow-y-auto lg:pr-2">
          
          {/* 背景圖片管理區 */}
          <div className="bg-white border border-gray-100 rounded-[24px] p-5 md:p-6 shadow-[0_4px_30px_rgba(0,0,0,0.01)] space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-mono uppercase font-bold">Images</span>
                <h3 className="font-bold text-gray-800 text-sm">中段背景輪播圖組</h3>
              </div>
              <button 
                type="button" 
                className="text-xs bg-black text-white px-3 py-1.5 rounded-full hover:bg-gray-800 transition shadow-sm font-medium"
                onClick={addImageField}
              >
                + 新增圖片
              </button>
            </div>

            <div className="space-y-3">
              {(data.bannerImages || []).map((imgName, idx) => {
                const imgSrc = previewSrcFor(imgName);
                return (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-gray-100/70">
                    
                    <div className="w-16 h-16 bg-gray-200/60 rounded-xl border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                      {imgName ? (
                        <img 
                          src={imgSrc} 
                          className="w-full h-full object-cover" 
                          alt="Preview" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">無檔名</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <span className="text-[10px] font-mono text-gray-400 block font-bold tracking-wider">IMAGE FILENAME {idx + 1}</span>
                      <div className="flex items-center gap-2">
                        <input 
                          type="text"
                          className="flex-1 border border-gray-200 rounded-xl text-xs p-2 bg-white font-mono focus:outline-none focus:border-black transition"
                          value={imgName || ""}
                          onChange={(e) => handleImageNameChange(idx, e.target.value)}
                          placeholder="例如: 1.jpg"
                        />
                        <button 
                          type="button"
                          className="text-xs border border-red-100 text-red-500 px-3 py-2 rounded-xl bg-white hover:bg-red-50 transition shrink-0 font-medium"
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
                  type="text"
                  className="w-full border border-gray-200 rounded-xl text-xs p-2.5 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-black transition"
                  value={data[lang.key]?.title || ""}
                  onChange={(e) => handleChange(lang.key, "title", e.target.value)}
                  placeholder="請輸入大標題..."
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider">核心介紹詳細內文 (Content)</label>
                <textarea 
                  className="w-full border border-gray-200 rounded-xl text-xs p-3 bg-gray-50/50 h-44 resize-y focus:bg-white focus:outline-none focus:border-black transition leading-relaxed"
                  value={data[lang.key]?.content || ""}
                  onChange={(e) => handleChange(lang.key, "content", e.target.value)}
                  placeholder="請輸入關於自我介紹的完整故事..."
                />
              </div>
            </div>
          ))}
        </div>

        {/* 右側欄位 2/5 JSON 預覽 */}
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