// functions/admin/api/upload-image.js

export async function onRequestPost(context) {
  const { env, request } = context;

  // 🎯 基礎 R2 安全性與繫結檢查
  if (!env.MY_R2_BUCKET || typeof env.MY_R2_BUCKET.put !== "function") {
    return new Response(
      JSON.stringify({ error: "R2 Bucket 未繫結或繫結型態錯誤，請確認 Pages 後台設定" }), 
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  try {
    // 🚀 解析前端傳來的 FormData
    const formData = await request.formData();
    const file = formData.get("file"); // 這是一個 File 物件
    const moduleType = formData.get("moduleType");
    const category = formData.get("category") || "";
    const fileName = formData.get("fileName");

    // 基礎參數完整性防禦
    if (!file || !moduleType || !fileName) {
      return new Response(
        JSON.stringify({ error: "缺少必要欄位 (file, moduleType, fileName)" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 網址路徑跳脫防禦 (防止路徑穿越攻擊)
    if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
      return new Response(JSON.stringify({ error: "不合法的檔案名稱" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    // 🎯 依照前端 getImageSrc 邏輯，拼湊 R2 的對應 Key
    let r2TargetKey = "";
    if (moduleType === "works") {
      r2TargetKey = `images/works/${category}/${fileName}`.replace(/\/\/+/g, "/"); // 防禦性移除重複斜線
    } else {
      r2TargetKey = `images/${moduleType}/${fileName}`;
    }

    // 轉換成 ArrayBuffer 後寫入 R2
    const arrayBuffer = await file.arrayBuffer();
    
    await env.MY_R2_BUCKET.put(r2TargetKey, arrayBuffer, {
      httpMetadata: { 
        contentType: file.type || "image/jpeg",
        cacheControl: "public, max-age=31536000" // R2 靜態圖片快取一年
      },
    });

    return new Response(
      JSON.stringify({ success: true, message: `圖片成功上傳至 R2 [${r2TargetKey}]` }), 
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `上傳程序翻車: ${err.message}` }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}