// src/app/news/page.js
import News from "@/app/_components/sections/News";
import { fetchNewsData } from "@/app/_lib/utils";

export default async function Page() {
  // 🎯 在 Server 端直接同步 R2 最新的最新消息
  const initialNewsData = await fetchNewsData();

  return (
    <div className="sticky top-0 min-h-screen z-20 bg-white bg-paper">
      {/* 把撈到的雲端資料作為 Props 灌入元件 */}
      <News initialData={initialNewsData} />
    </div>
  );
}