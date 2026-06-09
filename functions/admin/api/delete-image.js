// functions/admin/api/delete-image.js

export async function onRequestPost(context) {
  const { env, request } = context;

  // 🎯 基礎 R2 安全性與繫結檢查
  if (!env.MY_R2_BUCKET || typeof env.MY_R2_BUCKET.delete !== "function") {
    return new Response(
      JSON.stringify({ error: "R2 Bucket 未繫結或繫結型態錯誤，請確認 Pages 後台設定" }), 
      { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }

  try {
    // 解析前端傳來的垃圾清除資料
    const body = await request.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "無效的 JSON Body" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const { moduleType, files, categories } = body;

    if (!moduleType || !Array.isArray(files) || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "缺少必要參數或 files 格式錯誤" }), 
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const deletedLogs = [];

    // 🔄 批次走訪需要被消滅的舊圖片
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      
      // 阻擋惡意路徑
      if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
        continue; 
      }

      // 🎯 還原路徑結構
      let r2TargetKey = "";
      if (moduleType === "works") {
        const category = (categories && categories[i]) ? categories[i] : "";
        r2TargetKey = `images/works/${category}/${fileName}`.replace(/\/\/+/g, "/");
      } else {
        r2TargetKey = `images/${moduleType}/${fileName}`;
      }

      // 執行 R2 刪除 (Cloudflare R2 的 delete 是冪等的，檔案不在也不會噴錯)
      await env.MY_R2_BUCKET.delete(r2TargetKey);
      deletedLogs.push(r2TargetKey);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `成功從 R2 清除 ${deletedLogs.length} 張未使用的垃圾圖片。`,
        details: deletedLogs 
      }), 
      { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: `清理圖片失敗: ${err.message}` }), 
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}