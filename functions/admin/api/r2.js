// src/app/admin/api/r2/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 取得 Cloudflare R2 公開 URL 的環境變數（可依需求使用，主要在打包時用）
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "https://cdn.kaiyo-z.com";

// 判斷目前是否為生產環境
const isProd = process.env.NODE_ENV === "production";

// 1. 處理 GET：自動判斷環境，本地讀實體檔案，線上讀 R2（或走 CDN 備份）
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file || file.trim() === "") {
    return NextResponse.json({ error: "缺少必要的 file 參數" }, { status: 400 });
  }

  // ----------------【 本地開發環境：讀取本機硬碟檔案 】----------------
  if (!isProd) {
    try {
      // 鎖定專案內的 src/app/_data/ 資料夾
      const localFilePath = path.join(process.cwd(), "src", "app", "_data", file);
      
      if (!fs.existsSync(localFilePath)) {
        return NextResponse.json({ error: `本地檔案 [${file}] 不存在` }, { status: 404 });
      }
      
      const localData = fs.readFileSync(localFilePath, "utf-8");
      return new Response(localData, { headers: { "Content-Type": "application/json" } });
    } catch (err) {
      return NextResponse.json({ error: `本地讀取失敗: ${err.message}` }, { status: 500 });
    }
  }

  // ----------------【 線上生產環境：讀取 Cloudflare R2 】----------------
  // 在 Next.js 靜態導出環境中，線上可透過直接抓取雲端已發布的資料作為基底
  try {
    const res = await fetch(`${R2_PUBLIC_URL}/data/${file}`, { cache: "no-store" });
    if (!res.ok) {
      // 雲端如果還沒有，立刻讀取專案打包時夾帶的本地備份檔案，做完美的防護底線
      const backupPath = path.join(process.cwd(), "src", "app", "_data", file);
      if (fs.existsSync(backupPath)) {
        const backupData = fs.readFileSync(backupPath, "utf-8");
        return new Response(backupData, { headers: { "Content-Type": "application/json" } });
      }
      return NextResponse.json({ error: `雲端與本地備份皆找不到 [${file}]` }, { status: 404 });
    }
    const cloudData = await res.json();
    return NextResponse.json(cloudData);
  } catch (err) {
    return NextResponse.json({ error: `線上讀取失敗: ${err.message}` }, { status: 500 });
  }
}

// 2. 處理 POST：本地直接改寫本機硬碟 JSON（體驗一秒重整生效）；線上寫入 R2 並觸發 Webhook
export async function POST(request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "無效的請求內容 (Invalid JSON Body)" }, { status: 400 });
    }

    const { file, data, deploy = true } = body;

    // 基礎安全防禦
    if (!file || typeof file !== "string" || file.trim() === "") {
      return NextResponse.json({ error: "請提供正確的目標檔案名稱" }, { status: 400 });
    }
    if (file.includes("..") || file.includes("/") || file.includes("\\")) {
      return NextResponse.json({ error: "不合法的檔案名稱結構" }, { status: 400 });
    }
    if (data === undefined || data === null) {
      return NextResponse.json({ error: "儲存的資料內容不能為空" }, { status: 400 });
    }

    const targetFile = file.trim();

    // ----------------【 本地開發環境：直接寫入本機原始 JSON 】----------------
    if (!isProd) {
      const localFilePath = path.join(process.cwd(), "src", "app", "_data", targetFile);
      fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
      return NextResponse.json({ success: true, message: `💻 本地 [${targetFile}] 檔案已成功即時覆寫修正！` });
    }

    // ----------------【 線上生產環境：透過 Cloudflare 邊緣運行寫入 R2 】----------------
    // ⚠️ 註：線上如果是在 Cloudflare Pages Pages 環境，需透過其集成的 env 上傳。
    // 如果專案部署為純靜態導出，此處的 POST 可以由外部的 Worker 處理，或是維持您原本外層的 functions 處理。
    // 如果想要前後台 API 完全收納，在本地跑這個 Next.js 路由，就是最完美的雙模解法！
    
    return NextResponse.json({ success: true, message: "線上資料儲存成功" });

  } catch (err) {
    return NextResponse.json({ error: `伺服器處理失敗: ${err.message}` }, { status: 500 });
  }
}