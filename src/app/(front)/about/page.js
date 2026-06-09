// src/app/page.js

import Carousel from "@/app/_components/ui/Carousel";
import About from "@/app/_components/sections/About";
import MessageGallery from "@/app/_components/ui/MessageGallery";
import { fetchCarouselData, fetchAboutData, getAboutImagePath } from "@/app/_lib/utils"; 


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
  const currentSlides = await fetchCarouselData();
  const currentAboutData = await fetchAboutData();

  const rawBannerList = currentAboutData?.bannerImages || ["1.jpg", "4.jpg", "2.jpg"];
  const bannerImages = rawBannerList.map(imgName => getAboutImagePath(imgName));

  return (
    <div className="sticky top-0 min-h-screen z-20 bg-[var(--background)] bg-paper">
      <Carousel slides={currentSlides} />

      {/* 手機端：改為相對定位流程；桌面端：維持原來的絕對定位疊加 */}
      <section className="relative w-full my-6 md:my-10 flex flex-col md:block">
        
        {/* 背景輪播圖：手機端隱藏或只當作裝飾，這裡設定手機端正常排列，桌面端絕對定位 */}
        <div className="w-full opacity-[0.4] md:opacity-[0.7] py-4 md:py-10 order-2 md:order-none">
          <MessageGallery images={bannerImages} />
        </div>

        {/* 關於我主體：手機端為標準文檔流（不遮擋），桌面端絕對定位居中 */}
        <div className="
          relative md:absolute md:inset-0 
          flex items-center justify-center 
          pointer-events-none 
          order-1 md:order-none
          px-4 md:px-0
        ">
          <div className="pointer-events-auto w-full max-w-[1000px]">
            <About initialAboutData={currentAboutData} />
          </div>
        </div>
        
      </section>
    </div>
  );
}