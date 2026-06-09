// functions/admin/api/r2.js

// 🌟 全面進化：拋棄傳統 GET，改用與本地 100% 同步的 POST (read / save) 智慧型分流路由
export async function onRequestPost(context) {
  const { env, request } = context;

  // 🎯 基礎 R2 安全性與繫結檢查
  if (!env.MY_R2_BUCKET || typeof env.MY_R2_BUCKET.get !== "function" || typeof env.MY_R2_BUCKET.put !== "function") {
    return new Response(
      JSON.stringify({ error: "R2 Bucket 未繫結或繫結型態錯誤，請確認 Pages 後台使用的是『R2 儲存桶繫結』" }), 
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  try {
    // 解析前端傳來的 Body 參數
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "無效的 JSON Body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { file, data, action, deploy = true } = body;

    // 基礎參數完整性防禦
    if (!file || file.trim() === "") {
      return new Response(JSON.stringify({ error: "缺少 file 參數" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (!action || (action !== "read" && action !== "save")) {
      return new Response(JSON.stringify({ error: "未知的 action 指令，必須為 'read' 或 'save'" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // 網址路徑跳脫防禦 (防止路徑穿越攻擊)
    if (file.includes("..") || file.includes("/") || file.includes("\\")) {
      return new Response(JSON.stringify({ error: "不合法的檔案名稱" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // 🎯 核心對齊：自動補上 R2 桶子內實體的 data/ 資料夾前綴
    const r2TargetKey = `data/${file.trim()}`;

    // -------------------------------------------------------------
    // 💻 智慧分流 A：雲端 R2 讀取 (action === "read")
    // -------------------------------------------------------------
    if (action === "read") {
      const object = await env.MY_R2_BUCKET.get(r2TargetKey);
      
      if (object === null) {
        return new Response(
          JSON.stringify({ error: `雲端檔案 [${r2TargetKey}] 不存在，請確認 R2 內有該路徑` }), 
          { status: 404, headers: { "Content-Type": "application/json; charset=utf-8" } }
        );
      }

      const fileContent = await object.text();
      return new Response(fileContent, {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // -------------------------------------------------------------
    // 💻 智慧分流 B：雲端 R2 寫入 (action === "save")
    // -------------------------------------------------------------
    if (action === "save") {
      if (data === undefined || data === null) {
        return new Response(JSON.stringify({ error: "儲存的資料內容不能為空" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }

      // 安全寫入 R2 桶子
      await env.MY_R2_BUCKET.put(r2TargetKey, JSON.stringify(data, null, 2), {
        httpMetadata: { contentType: "application/json" },
      });

      // 觸發 Cloudflare Pages 重新打包部署的 Webhook
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
          message: deployTriggered 
            ? `資料已同步至 R2 [${r2TargetKey}]，網站打包重新生成中！` 
            : `資料已成功更新至 R2 [${r2TargetKey}]（暫不發布）。` 
        }), 
        { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
      );
    }

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}