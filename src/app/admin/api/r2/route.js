// src/app/admin/api/r2/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  // 🎯 線上生產環境直接裝死吐 404，不給任何人碰
  if (process.env.NODE_ENV === 'production') {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const { file, data, action } = await request.json();
    const localFilePath = path.join(process.cwd(), "src", "app", "_data", file);

    // 💻 智慧分流 A：本地讀取 (替代原本的 GET)
    if (action === "read") {
      if (!fs.existsSync(localFilePath)) {
        return NextResponse.json({ error: `本地檔案 [${file}] 不存在` }, { status: 404 });
      }
      const localData = fs.readFileSync(localFilePath, "utf-8");
      // 直接回傳 JSON 物件
      return NextResponse.json(JSON.parse(localData));
    }

    // 💻 智慧分流 B：本地寫入 (原本的 POST)
    if (action === "save") {
      fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
      return NextResponse.json({ success: true, message: "本地檔案改寫成功！" });
    }

    return NextResponse.json({ error: "未知的 action 指令" }, { status: 400 });
  } catch (err) { 
    return NextResponse.json({ error: err.message }, { status: 500 }); 
  }
}