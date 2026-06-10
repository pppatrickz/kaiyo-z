// src/app/HomePageClient.jsx
'use client';
import { useEffect, useState } from "react";
import Link from "next/link";
import News from "@/app/_components/sections/News";
import About from "@/app/_components/sections/About";
import Carousel from "@/app/_components/ui/Carousel";
import Contact from "@/app/_components/sections/Contact";
import StickyStage from "@/app/_components/layout/StickyStage";
import CenteredVideo from "@/app/_components/ui/CenteredVideo";
import Hero from "../_components/sections/Hero";
import { useLang } from "@/app/_lib/langContext";
// 🎯 引入影片切換工具
import { getVideoImagePath } from "@/app/_lib/utils"; 

export default function HomePageClient({ newsData, aboutData, carouselData }) {
  const [progress, setProgress] = useState(0);
  const { lang } = useLang();

  useEffect(() => {
    const onScroll = () => {
      const vh = window.innerHeight;
      const p = Math.min(window.scrollY / vh, 1);
      setProgress(p);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-[500vh]">
      {/* 階段 1：影片主視覺 */}
      <StickyStage zIndex={1} innerClassName="bg-white bg-paper">
        {/* 🎯 修改點 1：影片 src 自動對齊（本地吃相對路徑，線上吃 R2 雲端資源） */}
        {/* <CenteredVideo src={getVideoImagePath("TV.webm")} /> */}
      <Hero progress={progress} />
      </StickyStage>

      {/* 階段 2：最新消息區區塊 */}
      <StickyStage zIndex={2} innerClassName="bg-white bg-paper">
        {/* 🎯 修改點 2：灌入雲端撈回來的最新快訊 */}
        <News count="3" initialData={newsData} />
        <div className="text-center my-3 pb-50">
          <Link 
            href="/news" 
            className="inline-block px-3 py-1.5 rounded-full text-sm bg-black text-white shadow hover:bg-gray-200 transition"
          >
            {lang === "zh" ? "查看更多" : "Read More"}
          </Link>
        </div>
      </StickyStage>

      {/* 階段 3：關於我區塊 */}
      <StickyStage zIndex={3} innerClassName="bg-white flex items-center bg-paper">
        {/* 🎯 修改點 3：灌入雲端撈回來的自我介紹 */}
        <About initialAboutData={aboutData} />
      </StickyStage>

      {/* 階段 4：大首頁輪播幻燈片 */}
      <StickyStage zIndex={4} innerClassName="bg-white bg-paper">
        {/* 🎯 修改點 4：灌入由雲端 R2 CMS 管理員重新排序好的大首頁輪播圖 */}
        <Carousel slides={carouselData} />
      </StickyStage>

      {/* 階段 5：聯絡表單區塊 */}
      <StickyStage zIndex={5} innerClassName="bg-white bg-paper">
        <Contact />
      </StickyStage>
    </div>
  );
}