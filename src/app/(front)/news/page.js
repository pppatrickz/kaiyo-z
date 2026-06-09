// src/app/news/page.js

import News from "@/app/_components/sections/News";
import { fetchNewsData, getNewsImagePath } from "@/app/_lib/utils"; // 假設你有 getNewsImagePath 工具

// 🎯 動態生成最新一則消息的 SEO
export async function generateMetadata() {
  const newsList = await fetchNewsData() || [];
  
  // 1. 如果完全沒有消息，給予優雅的預設值
  if (newsList.length === 0) {
    return {
      title: "最新消息 | News - Kaiyo-Z",
      description: "瀏覽 Kaiyo-Z 的最新展覽、得獎動態與創作近況。",
    };
  }

  // 2. 永遠撈取陣列第一筆（最新的一則消息）
  const latestNews = newsList[0];
  const zh = latestNews.title?.zh || "";
  const ja = latestNews.title?.ja || "";
  const en = latestNews.title?.en || "";

  const zhContent = latestNews.content?.zh || "";
  const jaContent = latestNews.content?.ja || "";
  const enContent = latestNews.content?.en || "";

  // 3. 智慧型動態 OG Image：如果有活動圖片就用活動圖，沒有就用全站預設 og.png
  // 提示：請確保 getNewsImagePath 回傳的是絕對路徑（例如包含網域或 /news/xxx.jpg）
  const ogImage = latestNews.image 
    ? getNewsImagePath(latestNews.image) 
    : getNewsImagePath("og.png")

  // 4. 合併三語系標題 (呈現：[中文標題] | [日文標題] | News - Kaiyo-Z)
  // 為了防止標題過長，各語系抓取核心字數
  const combinedTitle = `${zh.substring(0, 25)}... | ${ja.substring(0, 25)}... | News - Kaiyo-Z`;

  // 5. 合併三語系簡介精華
  const combinedDescription = [
    zhContent ? `${zhContent.substring(0, 50)}...` : "",
    jaContent ? `${jaContent.substring(0, 50)}...` : "",
    enContent ? `${enContent.substring(0, 60)}...` : ""
  ].filter(Boolean).join(" / ");

  return {
    title: combinedTitle,
    description: combinedDescription,
    
    openGraph: {
      title: combinedTitle,
      description: combinedDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: zh || "Kaiyo-Z News",
        },
      ],
      type: "article", // 👈 既然是新聞消息，型態可以用 article 代替 website
    },
    
    twitter: {
      card: "summary_large_image",
      title: combinedTitle,
      description: combinedDescription,
      images: [ogImage],
    },
  };
}

// 頁面主體保持不變
export default async function Page() {
  const initialNewsData = await fetchNewsData();

  return (
    <div className="sticky top-0 min-h-screen z-20 bg-white bg-paper">
      <News initialData={initialNewsData} />
    </div>
  );
}