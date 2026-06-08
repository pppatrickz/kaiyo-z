// src/app/admin/api/r2/route.js
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";


// 💻 本地 GET：直接讀取你本機的 _data/ JSON
export async function GET(request) {
    if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const file = searchParams.get("file");

  if (!file || file.trim() === "") {
    return NextResponse.json({ error: "缺少必要的 file s參數" }, { status: 400 });
  }

  try {
    const localFilePath = path.join(process.cwd(), "src", "app", "_data", file);
    if (!fs.existsSync(localFilePath)) {
      return NextResponse.json({ error: `本地檔案 [${file}] 不存在` }, { status: 404 });
    }
    const localData = fs.readFileSync(localFilePath, "utf-8");
    return new Response(localData, { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 💻 本地 POST：直接覆寫你本機的 _data/ JSON，體驗一秒更新
export async function POST(request) {
    if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { file, data } = body;

    const localFilePath = path.join(process.cwd(), "src", "app", "_data", file);
    fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
    
    return NextResponse.json({ success: true, message: `💻 本地硬碟 [${file}] 覆寫成功！` });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}