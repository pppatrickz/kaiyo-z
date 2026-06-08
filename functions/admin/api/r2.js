// functions/admin/api/r2.js

// ☁️ 雲端 GET：從 R2 儲存桶撈取最新 JSON
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const file = url.searchParams.get("file");

  if (!env.MY_R2_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 Bucket 未繫結綁定" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  if (!file || file.trim() === "") {
    return new Response(JSON.stringify({ error: "缺少 file 參數" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  try {
    const object = await env.MY_R2_BUCKET.get(file);
    if (object === null) {
      return new Response(JSON.stringify({ error: `雲端檔案 [${file}] 不存在` }), { status: 404, headers: { "Content-Type": "application/json" } });
    }

    const data = await object.text();
    return new Response(data, {
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

// ☁️ 雲端 POST：接收前端管理面板資料，寫入 R2 並觸發 Webhook 自動部署
export async function onRequestPost(context) {
  const { env, request } = context;

  if (!env.MY_R2_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 Bucket 未繫結綁定" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "無效的 JSON Body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { file, data, deploy = true } = body;

    // 安全防禦
    if (!file || file.includes("..") || file.includes("/") || file.includes("\\")) {
      return new Response(JSON.stringify({ error: "不合法的檔案名稱" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // 安全寫入 Cloudflare R2
    await env.MY_R2_BUCKET.put(file.trim(), JSON.stringify(data, null, 2), {
      httpMetadata: { contentType: "application/json" },
    });

    // 觸發自動重新建置 Webhook
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
        message: deployTriggered ? "資料已更新，網站重組打包中！" : "資料已存入 R2（暫不發布）。" 
      }), 
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}