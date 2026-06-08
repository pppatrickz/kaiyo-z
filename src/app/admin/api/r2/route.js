// src/app/admin/api/r2/route.js
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 💻 本地 GET
export async function GET(request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response("Not Found", { status: 404 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get("file");
    const localFilePath = path.join(process.cwd(), "src", "app", "_data", file);
    const localData = fs.readFileSync(localFilePath, "utf-8");
    return new Response(localData, { headers: { "Content-Type": "application/json" } });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

// 💻 本地 POST
export async function POST(request) {
  // 🎯 如果是線上環境，直接裝死吐 404
  if (process.env.NODE_ENV === 'production') {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const { file, data } = await request.json();
    const localFilePath = path.join(process.cwd(), "src", "app", "_data", file);
    fs.writeFileSync(localFilePath, JSON.stringify(data, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}