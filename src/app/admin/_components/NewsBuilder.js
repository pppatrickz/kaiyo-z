/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";

const emptyI18n = () => ({ en: "", ja: "", zh: "" });

// 自由に入力された日付文字列から、安全に YYYY-MM-DD 形式のベースを作るヘルパー
function extractISODatePrefix(dateStr) {
  if (!dateStr) return new Date().toISOString().slice(0, 10);
  const cleaned = String(dateStr).trim();
  
  // すでに YYYY-MM-DD 形式の場合
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
  
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  
  // 解析できない自由な形式の場合は、数字だけを抽出して成形を試みるか、今日の入力をフォールバックにする
  const match = cleaned.match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
  if (match) {
    const [_, y, m, d] = match;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  
  return new Date().toISOString().slice(0, 10);
}

// 安全にファイル保存/ダウンロードを行う関数
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

  // ニュース内の画像ドラッグ順序管理用
  const draggingImageIndexRef = useRef(null);

  // 🎯 核心ロジック：日付ベースの一意なスマートID（旧Slug）自動生成器
  const generateSmartNewsId = (newsArray, targetNewsId, dateString) => {
    const baseDatePrefix = extractISODatePrefix(dateString); // "2026-06-08" のような形式を取得
    
    // 自分自身を除外した、既存のニュースリストを取得
    const otherNews = newsArray.filter(n => n.id !== targetNewsId);
    
    let counter = 1;
    let finalId = `${baseDatePrefix}-${counter}`;
    
    // 他のニュースと重複している間、末尾の数値を増やし続ける
    while (otherNews.some(n => String(n.id) === finalId)) {
      counter++;
      finalId = `${baseDatePrefix}-${counter}`;
    }
    
    return finalId;
  };

  // 🎯 データ構造のクレンジング関数（インポートやクラウド読み込み時にキーを slug -> id へ安全に移行）
  const sanitizeAndSyncNews = (rawArray) => {
    if (!Array.isArray(rawArray)) return [];
    
    const processedNews = [];
    rawArray.forEach((n) => {
      const item = { ...n };
      
      // 古いデータの「slug」キーを「id」にコンバート、どちらも無ければ暫定ID
      item.id = item.id || item.slug || `temp-${Date.now()}`;
      if (item.slug) delete item.slug; // 古いキーは削除
      
      item.image = item.image || "";
      item.alt = item.alt || "";
      item.date = item.date || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }); 
      item.title = item.title || emptyI18n();
      item.content = item.content || emptyI18n();
      item.images = Array.isArray(item.images) ? item.images : [];
      
      // 既存のIDが古いUUIDなどの場合、あるいは未整頓の場合は日付ベースに再計算して固定
      if (item.id.startsWith("temp-") || item.id.includes("-") && item.id.length > 20) {
        item.id = generateSmartNewsId(processedNews, item.id, item.date);
      }
      
      processedNews.push(item);
    });
    
    return processedNews;
  };

  // 1. データ読み込み処理 (R2 雲端同期)
  useEffect(() => {
    if (isCloud) {
      fetch("/admin/api/r2?file=news.json")
        .then((res) => res.ok ? res.json() : null)
        .then((cloudData) => {
          if (cloudData) {
            setNews(sanitizeAndSyncNews(cloudData));
          }
        })
        .catch(() => console.log("クラウド上に news.json が見つかりません"));
    }
  }, [isCloud]);

  // 2. 外部へ出力するJSONデータの組み立て（キー名を「id」に完全統合）
  const assembleOutput = () => {
    return news.map((n) => ({
      id: n.id, // ここを id に統一
      image: n.image || "",
      alt: n.alt || "",
      date: n.date, // ユーザーが入力した文字列（"October 13, 2025" など）をそのまま維持
      title: { en: n.title?.en || "", ja: n.title?.ja || "", zh: n.title?.zh || "" },
      content: { en: n.content?.en || "", ja: n.content?.ja || "", zh: n.content?.zh || "" },
      images: Array.isArray(n.images) ? n.images : [],
    }));
  };

  // R2 への保存（deploy の有無を選択可能）
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
        alert(shouldDeploy ? "🎉 ニュースデータをR2に書き込み、自動ビルド・デプロイを開始しました！" : "💾 ニュースデータをR2に保存しました（デプロイはスキップ）。");
      } else {
        alert(`エラー: ${resData.error}`);
      }
    } catch {
      alert("クラウドへの保存に失敗しました。");
    } finally { setIsSaving(false); }
  };

  const exportJSON = () => {
    downloadBlob(JSON.stringify(assembleOutput(), null, 2), "news.json", "application/json");
  };

  const copyJSON = async () => {
    await navigator.clipboard.writeText(JSON.stringify(assembleOutput(), null, 2));
    alert("JSON をクリップボードにコピーしました");
  };

  // ローカルファイルのインポート処理（移行対応型）
  const importFromFile = async (file) => {
    try {
      const text = await file.text(); 
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) throw new Error("JSONのルート構造は配列である必要があります");
      
      setNews(sanitizeAndSyncNews(parsed)); 
      setActiveIndex(null);
    } catch (e) { alert(`インポート失敗: ${e.message}`); }
  };

  // ---------- CRUD 操作ロジック ----------
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
      // 新規追加の段階で重複をチェックし、綺麗な「日付-連番」のIDを割り当てる
      item.id = generateSmartNewsId(prev, tempId, todayStr);
      const next = [item, ...prev]; // 新しいものを先頭に追加
      setActiveIndex(0);
      return next;
    });
  };

  const removeNews = (idx) => { 
    if (confirm("このお知らせを削除しますか？")) { 
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

  // 🎯 日付変更時などにリアルタイムに一意なID（URL用Slug）を再計算する
  const updateNews = (idx, patch) => { 
    setNews(prev => { 
      const c = [...prev]; 
      const target = { ...c[idx], ...patch };
      
      // もし日付文字列が書き換えられたら、IDも即座に再評価して書き換える
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

  // ---------- 画像アップロードとドラッグ＆ドロップ処理 ----------
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
      if (!c[idx].image) c[idx].image = name;
      return c; 
    }); 
  };

  const removeImageFromItem = (idx, name) => { 
    setNews(p => { 
      const c = [...p]; 
      c[idx].images = (c[idx].images || []).filter(n => n !== name); 
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
    <div className="text-slate-900 p-8 bg-slate-50 min-h-screen">
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">📰 最新消息管理面板 (News Admin)</h2>
          <p className="text-xs text-slate-500 mt-1">目前模式：{isCloud ? "☁️ R2 雲端同步" : "💻 本地檔案輸出"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm" onClick={addNews}>+ 新增快訊</button>
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
            <button className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm" onClick={exportJSON}>📥 下載新聞 JSON</button>
          )}

          <label className="px-3 py-1.5 rounded-lg bg-white border text-sm cursor-pointer">
            匯入 JSON
            <input type="file" accept="application/json" className="hidden" onChange={e => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </label>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：暫存媒體櫃 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border p-4 shadow-sm sticky top-6">
            <h3 className="font-semibold text-slate-700 mb-2">新聞圖庫櫃 (點擊圖片附加至選定公告)</h3>
            <div className="border-2 border-dashed rounded-xl p-4 text-center bg-slate-50 cursor-pointer hover:bg-slate-100 transition" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); e.dataTransfer.files && onDropFiles(e.dataTransfer.files); }} onClick={() => fileInputRef.current?.click()}>
              <span className="text-xs text-slate-400">拖曳圖片至此或點擊上傳</span>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => e.target.files && onDropFiles(e.target.files)} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 max-h-[400px] overflow-y-auto">
              {imageLibrary.map(img => (
                <button 
                  key={img.id} 
                  type="button"
                  disabled={activeIndex === null}
                  className="border rounded overflow-hidden text-[10px] text-center bg-slate-50 hover:border-blue-500 transition disabled:opacity-50"
                  onClick={() => activeIndex !== null && attachImageToItem(activeIndex, img.name)}
                >
                  <img src={img.url} className="h-14 w-full object-cover" alt="" />
                  <div className="p-1 truncate">{img.name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右側：主要清單與表單編輯 */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border rounded-xl p-4 shadow-sm max-h-[850px] overflow-y-auto">
            <span className="text-sm font-semibold text-slate-500 block mb-3">公告列表總計 ({news.length})</span>
            
            {news.map((item, i) => {
              const isActive = activeIndex === i;
              
              // 🎯 キーを固有の item.id にバインドすることで、競合を完全にシャットアウト
              return (
                <div key={item.id} className={classNames("p-4 border-b flex gap-4 transition cursor-pointer last:border-0", isActive ? "bg-blue-50/50 ring-1 ring-blue-200 rounded-xl my-2" : "hover:bg-slate-50/80")} onClick={() => setActiveIndex(i)}>
                  
                  <div className="w-20 shrink-0">
                    <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden border">
                      {item.image ? (
                        <img src={imageSrcFor(item, item.image)} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="text-[10px] grid place-items-center h-full text-slate-400">無封面</div>
                      )}
                    </div>
                    <div className="flex justify-center gap-1 mt-2">
                      <button type="button" className="border bg-white px-1.5 py-0.5 text-xs rounded hover:bg-slate-100" onClick={e => { e.stopPropagation(); moveNews(i, -1); }}>↑</button>
                      <button type="button" className="border bg-white px-1.5 py-0.5 text-xs rounded hover:bg-slate-100" onClick={e => { e.stopPropagation(); moveNews(i, 1); }}>↓</button>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3" onClick={e => e.stopPropagation()}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">網址識別碼 (ID / Slug)</span>
                        {/* 💡 閲覧用・デプロイ用の一意なID。下のDateを変更すると自動的に「日付-1」のように再生成されます */}
                        <div className="w-full bg-slate-100 border rounded text-xs p-1.5 font-mono font-bold text-blue-600 truncate">
                          🔗 {item.id}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">顯示日期 (Date String)</span>
                        <input className="w-full border rounded text-xs p-1.5" value={item.date || ""} onChange={e => updateNews(i, { date: e.target.value })} placeholder="例如: October 13, 2025" />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">圖片替代文字 (Alt)</span>
                      <input className="w-full border rounded text-xs p-1.5" value={item.alt || ""} onChange={e => updateNews(i, { alt: e.target.value })} placeholder="例如: Award News" />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">📢 公告標題 (Title)</span>
                      <div className="grid grid-cols-3 gap-2">
                        {["en", "ja", "zh"].map(l => (
                          <input key={l} className="border rounded text-xs p-1.5" value={item.title?.[l] || ""} onChange={e => updateI18n(i, "title", l, e.target.value)} placeholder={`標題 (${l})`} />
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold mb-1">📝 詳細內文 (Content)</span>
                      <div className="space-y-1.5">
                        {["zh", "ja", "en"].map(l => (
                          <div key={l} className="flex gap-1 items-start">
                            <span className="text-[10px] uppercase font-mono text-slate-400 w-6 mt-2">{l}:</span>
                            <textarea className="border rounded text-xs p-1.5 flex-1 h-20 resize-y" value={item.content?.[l] || ""} onChange={e => updateI18n(i, "content", l, e.target.value)} placeholder={`輸入 ${l.toUpperCase()} 消息內文...`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-2">
                      <span className="block text-[11px] text-slate-600 font-bold">📸 已綁定相簿圖片組（滑鼠按住可直接拖曳換位）</span>
                      
                      {item.images && item.images.length ? (
                        <div className="space-y-1.5">
                          {item.images.map((imgName, imgIdx) => (
                            <div 
                              key={`${imgName}-${imgIdx}`} 
                              draggable
                              onDragStart={() => handleImageDragStart(imgIdx)}
                              onDragOver={handleImageDragOver}
                              onDrop={() => handleImageDrop(i, imgIdx)}
                              className="flex justify-between items-center bg-white p-2 border rounded-lg shadow-sm gap-2 cursor-grab active:cursor-grabbing hover:border-blue-400 transition"
                            >
                              <div className="flex items-center gap-2 truncate pointer-events-none">
                                <span className="text-slate-300 font-bold select-none">☰</span>
                                <img src={imageSrcFor(item, imgName)} className="w-7 h-7 rounded object-cover border shrink-0" alt="" />
                                <span className="truncate font-mono text-[11px] text-slate-600">{imgName}</span>
                                {item.image === imgName && <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded">封面主圖</span>}
                              </div>
                              <div className="space-x-1 shrink-0 flex items-center">
                                <button type="button" className="text-[10px] border bg-slate-50 px-1 py-0.5 rounded text-slate-400" onClick={() => moveImageWithinItem(i, imgIdx, -1)}>↑</button>
                                <button type="button" className="text-[10px] border bg-slate-50 px-1 py-0.5 rounded text-slate-400" onClick={() => moveImageWithinItem(i, imgIdx, 1)}>↓</button>
                                <button type="button" className={classNames("text-[10px] px-1.5 py-0.5 border rounded", item.image === imgName ? "bg-slate-900 text-white" : "bg-slate-50")} onClick={() => updateNews(i, { image: imgName })}>設為主圖</button>
                                <button type="button" className="text-red-500 text-[10px] border border-red-100 px-1 rounded bg-red-50/50 hover:bg-red-50" onClick={() => removeImageFromItem(i, imgName)}>移除</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">目前無相片。請點擊左側圖庫櫃上傳並將其附加至此公告。</p>
                      )}
                    </div>
                  </div>

                  <button type="button" className="text-xs text-red-500 border border-red-200 hover:bg-red-50 px-2 py-1 rounded h-8 self-start" onClick={e => { e.stopPropagation(); removeNews(i); }}>刪除</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}