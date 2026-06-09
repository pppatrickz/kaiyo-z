// src/app/admin/_hooks/useAdminData.js
import { useState, useEffect, useCallback } from "react";

export function useAdminData({ file, isCloud, sanitizeFn }) {
  const [data, setData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // 🎯 1. 統一的讀取邏輯 (POST + action: "read")
  const loadData = useCallback(async () => {
    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", file })
      });
      if (res.ok) {
        const rawData = await res.json();
        // 呼叫每個 Builder 自己獨有的清洗邏輯
        setData(sanitizeFn ? sanitizeFn(rawData) : rawData);
      } else {
        console.error(`無法自動取得檔案: ${file}`);
      }
    } catch (err) {
      console.error("載入資料失敗", err);
    }
  }, [file, sanitizeFn]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 🎯 2. 統一的儲存邏輯 (POST + action: "save")
  const saveData = useCallback(async (outputData, shouldDeploy = true) => {
    setIsSaving(true);
    const requestBody = isCloud
      ? { action: "save", file, data: outputData, deploy: shouldDeploy }
      : { action: "save", file, data: outputData };

    try {
      const res = await fetch("/admin/api/r2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      if (res.ok) {
        alert(isCloud ? (shouldDeploy ? "🎉 雲端數據儲存發布成功，打包中！" : "💾 資料已同步至 R2。") : "💻 本地資料改寫完成！");
        return true;
      } else {
        alert("儲存失敗");
        return false;
      }
    } catch {
      alert("儲存時發生連線失敗");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [file, isCloud]);

  // 🎯 3. 統一的複製到剪貼簿
  const copyToClipboard = useCallback(async (outputData) => {
    await navigator.clipboard.writeText(JSON.stringify(outputData, null, 2));
    alert("JSON 結構內容已成功複製至剪貼簿！");
  }, []);

  // 🎯 4. 統一的下載 Blob 檔案
  const downloadJSON = useCallback((outputData) => {
    const blob = new Blob([JSON.stringify(outputData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file;
    a.click();
    URL.revokeObjectURL(url);
  }, [file]);

  return { data, setData, isSaving, loadData, saveData, copyToClipboard, downloadJSON };
}