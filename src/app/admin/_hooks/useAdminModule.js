// src/app/admin/_hooks/useAdminModule.js
import { useState, useEffect, useCallback, useMemo } from "react";

// 🎯 通用的圖片路徑解析器 (後台獨立使用，不依賴前端 lib)
export function getImageSrc({ type, category = "", fileName = "", blobUrl = "" }) {
  if (blobUrl) return blobUrl; // 優先使用待上傳的本地預覽虛擬網址
  if (!fileName) return "";

  const isProd = process.env.NODE_ENV === "production";
  const R2_PUBLIC_URL = "https://cdn.kaiyo-z.com"; // 🌟 請替換成你的 R2 公開網域

  if (isProd) {
    return type === "works"
      ? `${R2_PUBLIC_URL}/images/works/${category}/${fileName}`
      : `${R2_PUBLIC_URL}/images/${type}/${fileName}`;
  } else {
    return type === "works"
      ? `/works/${category}/${fileName}`
      : `/${type}/${fileName}`;
  }
}

export function useAdminModule({ moduleType, fileName, sanitizeFn, extractImagesFn }) {
  const [jsonData, setJsonData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🎯 圖片暫存庫：待上傳 vs 已存在
  const [pendingImages, setPendingImages] = useState([]); // [{ id, file, name, url, category }]
  const [existingImages, setExistingImages] = useState([]); // 存原本 JSON 裡有的圖片檔名
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false); // 🌟 流量守護星：控制是否加載 R2 媒體櫃

  const isCloud = process.env.NODE_ENV !== "development";

  // 1. 初始化只讀取純文字的 JSON
  const loadJson = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", file: fileName })
      });
      if (res.ok) {
        const raw = await res.json();
        setJsonData(sanitizeFn ? sanitizeFn(raw) : raw);
      }
    } catch (err) {
      console.error(`載入 ${fileName} 失敗`, err);
    }
  }, [fileName, sanitizeFn]);

  useEffect(() => { loadJson(); }, [loadJson]);

  // 🎯 2. 省流量按鈕核心：管理員點擊後，才從目前的 JSON 結構中抽取所有圖片檔名，解鎖顯示！
  const loadExistingImages = useCallback(() => {
    if (!jsonData || !extractImagesFn) return;
    const imgs = extractImagesFn(jsonData);
    setExistingImages(imgs);
    setIsLibraryLoaded(true); // 標記為已解鎖
  }, [jsonData, extractImagesFn]);

  // 3. 當使用者拖曳或上傳新圖片時，加入「未上傳暫存區」
  const addPendingFiles = useCallback((files, category = "") => {
    const newPending = [];
    Array.from(files).forEach((f) => {
      const id = `${f.name}-${f.size}-${f.lastModified}`;
      if (!pendingImages.some(p => p.id === id) && !existingImages.includes(f.name)) {
        newPending.push({
          id,
          file: f,
          name: f.name,
          url: URL.createObjectURL(f),
          category
        });
      }
    });
    if (newPending.length) setPendingImages(prev => [...prev, ...newPending]);
  }, [pendingImages, existingImages]);

  // 4. 按下保存時，同時處理 JSON 寫入、圖片上傳、垃圾圖片清理
  const saveModuleChanges = useCallback(async (outputJson, shouldDeploy = true) => {
    setIsSaving(true);
    try {
      // 🚀 A. 先上傳所有「待上傳 pending」的實體檔案 (FormData 流)
      if (pendingImages.length > 0) {
        for (const img of pendingImages) {
          const formData = new FormData();
          formData.append("file", img.file);
          formData.append("moduleType", moduleType);
          formData.append("category", img.category || "");
          formData.append("fileName", img.name);

          const imgRes = await fetch("/admin/api/upload-image", {
            method: "POST",
            body: formData,
          });
          if (!imgRes.ok) throw new Error(`圖片 ${img.name} 上傳失敗`);
        }
      }

      // 🗑️ B. 智慧型清理垃圾檔案（比對新舊 JSON 找出消失的圖片）
      if (isLibraryLoaded && extractImagesFn) {
        const nextImages = extractImagesFn(outputJson);
        const deletedImages = existingImages.filter(img => !nextImages.includes(img));

        if (deletedImages.length > 0) {
          await fetch("/admin/api/delete-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              moduleType, 
              files: deletedImages, 
              categories: outputJson.works ? deletedImages.map(img => outputJson.works.find(w => w.images.includes(img))?.category || "") : [] 
            })
          });
        }
      }

      // 💾 C. 寫入最新的 JSON 檔案
      const requestBody = isCloud
        ? { action: "save", file: fileName, data: outputJson, deploy: shouldDeploy }
        : { action: "save", file: fileName, data: outputJson };

      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        alert(isCloud ? "🎉 雲端 JSON 與圖片同步儲存發布成功！" : "💻 本地硬碟 JSON 與圖片改寫儲存完成！");
        setPendingImages([]); // 清空待上傳暫存
        setJsonData(outputJson); // 更新畫面狀態
        
        // 重新整理現有媒體清單（如果本來就有打開的話）
        if (isLibraryLoaded && extractImagesFn) {
          setExistingImages(extractImagesFn(outputJson));
        }
        return true;
      }
      alert("JSON 儲存失敗");
      return false;
    } catch (err) {
      alert(`儲存程序翻車: ${err.message}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [fileName, isCloud, pendingImages, existingImages, extractImagesFn, moduleType, isLibraryLoaded]);

  return {
    jsonData,
    setJsonData,
    isSaving,
    existingImages,
    pendingImages,
    isLibraryLoaded,       // 🌟 前端用來判斷：現在到底解鎖媒體櫃了沒
    loadExistingImages,    // 🌟 前端給按鈕綁定的 onClick 函式
    addPendingFiles,
    saveModuleChanges
  };
}