// 處理 GET：從 R2 讀取 JSON
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const file = url.searchParams.get("file");

  if (!env.MY_R2_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 Bucket 未綁定" }), { status: 500 });
  }

  // ⚡ 新增：防禦沒有帶 file 參數的情況
  if (!file || file.trim() === "") {
    return new Response(JSON.stringify({ error: "缺少必要的 file 參數" }), { status: 400 });
  }

  try {
    const object = await env.MY_R2_BUCKET.get(file);
    if (object === null) {
      return new Response(JSON.stringify({ error: `檔案 [${file}] 不存在` }), { status: 404 });
    }

    const data = await object.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// 處理 POST：將編輯後的 JSON 寫入 R2，並觸發自動部署
export async function onRequestPost(context) {
  const { env, request } = context;

  // 1. 先確認 R2 綁定狀態，如果沒繫結就不需要往下解析 Body
  if (!env.MY_R2_BUCKET) {
    return new Response(
      JSON.stringify({ error: "R2 Bucket 未綁定，請檢查 Cloudflare Pages 後台設定" }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // 2. 解析前端傳來的 JSON Body
    const body = await request.json().catch(() => null);
    
    // 防禦：如果前端傳來空值，或是根本不是合法的 JSON 格式
    if (!body) {
      return new Response(
        JSON.stringify({ error: "無效的請求內容 (Invalid JSON Body)" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ⚡ 新增 deploy 參數，預設為 true（若前端傳 false 則不部署）
    const { file, data, deploy = true } = body;

    // 3. 防禦：檔名安全檢查
    // 如果 file 欄位為空，或是傳入了一些奇怪的檔名（例如空字串）
    if (!file || typeof file !== "string" || file.trim() === "") {
      return new Response(
        JSON.stringify({ error: "請提供正確的目標檔案名稱 (file is required)" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4. 防禦：防止目錄遍歷攻擊 (Directory Traversal)
    // 避免有人在前端惡意傳入 ../../package.json 企圖覆蓋你專案根目錄的重要檔案
    if (file.includes("..") || file.includes("/") || file.includes("\\")) {
      return new Response(
        JSON.stringify({ error: "不合法的檔案名稱結構" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 5. 防禦：確保寫入的資料不是空的
    // 如果 data 是 undefined 或 null，寫入 R2 會變成空檔案，前台打包時會噴錯
    if (data === undefined || data === null) {
      return new Response(
        JSON.stringify({ error: "儲存的資料內容不能為空" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const targetFile = file.trim();

    // 6. 直接寫入 R2 Bucket（防禦通過，安全執行）
    await env.MY_R2_BUCKET.put(targetFile, JSON.stringify(data, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });

    // 7. 觸發 Cloudflare Pages 重新部署 (Webhook)
    let deployTriggered = false;
    if (deploy && env.CLOUDFLARE_DEPLOY_HOOK) {
      try {
        const deployRes = await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: "POST" });
        if (deployRes.ok) deployTriggered = true;
      } catch (deployErr) {
        // 即使部署 Webhook 失敗，資料也已經存入 R2 了，我們記錄錯誤但不讓整個 API 壞掉
        console.error("Deploy hook failed:", deployErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: deployTriggered 
          ? `資料已成功更新，並開始重新打包網站！`
          : `資料已成功儲存至 R2（暫不發布，前台網站不會更新）。`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    // 捕獲 R2 系統級別的錯誤（例如網路超時、Cloudflare 服務異常等）
    return new Response(
      JSON.stringify({ error: `伺服器處理失敗: ${err.message}` }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}