// functions/admin/api/r2.js

// ☁️ 雲端 GET：從 R2 儲存桶撈取最新 JSON
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const file = url.searchParams.get("file");

  if (!env.MY_R2_BUCKET || typeof env.MY_R2_BUCKET.get !== "function") {
    return new Response(JSON.stringify({ error: "R2 Bucket 未繫結或繫結型態錯誤" }), { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }

  if (!file || file.trim() === "") {
    return new Response(JSON.stringify({ error: "缺少 file 參數" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    // 🎯 核心修正：自動補上 data/ 虛擬目錄前綴，對齊你在 R2 桶子裡的實際路徑！
    const r2TargetKey = `data/${file.trim()}`; 

    const object = await env.MY_R2_BUCKET.get(r2TargetKey);
    if (object === null) {
      return new Response(JSON.stringify({ error: `雲端檔案 [${r2TargetKey}] 不存在，請檢查 R2 儲存桶內是否有該路徑` }), { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } });
    }

    const data = await object.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// ☁️ 雲端 POST：接收前端資料寫入 R2
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.MY_R2_BUCKET || typeof env.MY_R2_BUCKET.put !== "function") {
    return new Response(JSON.stringify({ error: "R2 Bucket 未繫結" }), { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "無效的 JSON Body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (body.action !== undefined) {
      return new Response(JSON.stringify({ error: "雲端 R2 拒絕接收本地特別指令集" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { file, data, deploy = true } = body;

    if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
      return new Response(JSON.stringify({ error: "不合法的檔案名稱" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    if (data === undefined || data === null) {
      return new Response(JSON.stringify({ error: "儲存的資料內容不能為空" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // 🎯 核心修正：儲存時也同步補上 data/ 前綴，確保儲存位置與讀取位置絕對對齊！
    const r2TargetKey = `data/${file.trim()}`;

    await env.MY_R2_BUCKET.put(r2TargetKey, JSON.stringify(data, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });

    let deployTriggered = false;
    if (deploy && env.CLOUDFLARE_DEPLOY_HOOK) {
      try {
        const deployRes = await fetch(env.CLOUDFLARE_DEPLOY_HOOK, { method: "POST" });
        if (deployRes.ok) deployTriggered = true;
      } catch (e) {
        console.error("Deploy hook trigger failed:", e);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: deployTriggered ? "資料已成功同步儲存至 R2 data 資料夾，網站打包部署中！" : "資料已更新至 R2 data 資料夾（暫不發布）。" 
      }), 
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}