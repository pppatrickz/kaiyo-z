// src/app/news/[slug]/page.js

import { notFound } from "next/navigation";
import NewsDetailClient from "./NewsDetailClient";
import { fetchNewsData, getNewsImagePath } from "@/app/_lib/utils"; // 🎯 確保引入圖片工具

// 🎯 1. 靜態路由生成
export async function generateStaticParams() {
  const newsData = await fetchNewsData();
  
  return (newsData ?? []).map((item) => ({
    slug: String(item.id),
  }));
}

// 🎯 2. 新增：內頁專屬動態 SEO Metadata
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const newsData = await fetchNewsData() || [];

  // 尋找當前這篇新聞
  const newsItem = newsData.find((n) => String(n.id) === String(slug));

  // 如果找不到這篇消息，回傳最基礎的標題防炸
  if (!newsItem) {
    return {
      title: "最新消息 | News - Kaiyo-Z",
    };
  }

  // 擷取該篇新聞的三語系內容
  const zh = newsItem.title?.zh || "";
  const ja = newsItem.title?.ja || "";
  const en = newsItem.title?.en || "";

  const zhContent = newsItem.content?.zh || "";
  const jaContent = newsItem.content?.ja || "";
  const enContent = newsItem.content?.en || "";

  // 智慧型活動縮圖：精準抓取該篇新聞的主視覺圖
  const ogImage = newsItem.image 
    ? getNewsImagePath(newsItem.image) 
    : "/images/og.png"; 

  // 串接這篇新聞專屬的三語系黃金標題（控制長度，避免過長被 Google 截斷）
  const combinedTitle = `${zh.substring(0, 25)}... | ${ja.substring(0, 25)}... | Kaiyo-Z`;

  // 串接這篇新聞專屬的三語系內容摘要（最利於搜尋引擊收錄）
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
          alt: zh || "Kaiyo-Z News Detail",
        },
      ],
      type: "article", // 👈 內頁是非常標準的獨立文章（article）型態
      publishedTime: newsItem.date, // 可選：若有 ISO 時間格式效果更好
    },
    
    twitter: {
      card: "summary_large_image",
      title: combinedTitle,
      description: combinedDescription,
      images: [ogImage],
    },
  };
}

// 🎯 3. 頁面主體渲染（與你原本的邏輯完全對齊）
export default async function NewsDetail({ params }) {
  const { slug } = await params;
  const newsData = await fetchNewsData();

  const newsItem = (newsData ?? []).find((n) => String(n.id) === String(slug));

  if (!newsItem) {
    notFound();
  }

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