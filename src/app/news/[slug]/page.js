// src/app/news/[slug]/page.js
import { notFound } from "next/navigation";
import NewsDetailClient from "./NewsDetailClient";
import { fetchNewsData } from "@/app/_lib/utils"; // 🎯 引入我們寫好的 R2 快取撈取工具

export async function generateStaticParams() {
  const newsData = await fetchNewsData();
  
  return (newsData ?? []).map((item) => ({
    slug: String(item.id), // 🎯 與後台完美對齊唯一的 id (智慧日付-連番)
  }));
}

export default async function NewsDetail({ params }) {
  const { slug } = await params;
  const newsData = await fetchNewsData();

  // 🎯 1. 依照 id 比對找到當前新聞
  const newsItem = (newsData ?? []).find((n) => String(n.id) === String(slug));

  if (!newsItem) {
    notFound(); // 🎯 找不到時觸發標準 404
  }

  // 🎯 2. 精準計算「上一則（較新）」與「下一則（較舊）」
  // 直接利用 id (格式如 YYYY-MM-DD-X) 進行排序，絕對安全防炸
  const sorted = [...newsData].sort((a, b) => String(b.id || "").localeCompare(String(a.id || "")));
  const currentIndex = sorted.findIndex((n) => String(n.id) === String(slug));

  const prevItem = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextItem = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;

  return (
    <NewsDetailClient 
      newsItem={newsItem} 
      prevItem={prevItem}
      nextItem={nextItem}
    />
  );
}