// src/app/page.js
import HomePageClient from "./HomePageClient"; // 引入下方的前端本體
// 🎯 引入全套雲端 R2 快取撈取工具
import { fetchNewsData, fetchAboutData, fetchCarouselData } from "@/app/_lib/utils"; 
import { getAboutImagePath } from "@/app/_lib/utils";


export async function generateMetadata() {
  const currentAboutData = await fetchAboutData();
  
  // 1. 安全地撈取三種語系資料
  const zh = currentAboutData?.zh || {};
  const ja = currentAboutData?.ja || {};
  const en = currentAboutData?.en || {};
  
  const ogImage = getAboutImagePath("og.png"); 

  // 2. 合併標題 (控制長度，呈現：關於我 / 自己紹介 / About Me)
  const combinedTitle = `${zh.title || "關於我"} | ${ja.title || "自己紹介"} | ${en.title || "About Me"} - Kaiyo-Z`;

  // 3. 合併簡介 (各抓前 50~60 個字，控制總字數在 160 字左右，最利於 Google 搜尋與社群顯示)
  const combinedDescription = [
    zh.content ? `${zh.content.substring(0, 50)}...` : "",
    ja.content ? `${ja.content.substring(0, 50)}...` : "",
    en.content ? `${en.content.substring(0, 60)}...` : ""
  ].filter(Boolean).join(" / "); // 用斜線分隔三種語言

  return {
    title: combinedTitle,
    description: combinedDescription,
    
    // Open Graph (FB, Line, Threads)
    openGraph: {
      title: combinedTitle,
      description: combinedDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: "About Kaiyo-Z ",
        },
      ],
      type: "website",
    },
    
    // X (Twitter) 卡片
    twitter: {
      card: "summary_large_image",
      title: combinedTitle,
      description: combinedDescription,
      images: [ogImage],
    },
  };
}

export default async function Page() {
  // 🎯 一口氣在伺服器端把首頁需要的所有 R2 最新資料全部載入
  // 透過 React cache() 機制，這裡就算全站重複呼叫也完全不重複耗費流量
  const newsData = await fetchNewsData();
  const aboutData = await fetchAboutData();
  const carouselData = await fetchCarouselData();


  return (
    <HomePageClient 
      newsData={newsData} 
      aboutData={aboutData} 
      carouselData={carouselData} 
    />
  );
}