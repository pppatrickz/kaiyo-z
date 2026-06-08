// src/app/page.js
import HomePageClient from "./HomePageClient"; // 引入下方的前端本體
// 🎯 引入全套雲端 R2 快取撈取工具
import { fetchNewsData, fetchAboutData, fetchCarouselData } from "@/app/_lib/utils"; 

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