"use client";
import { useMemo } from "react";
import NewsCard from "@/app/_components/ui/Newscard.js";
import { useLang } from "@/app/_lib/langContext";
// 🎯 引入新聞圖片路徑工具
import { getNewsImagePath } from "@/app/_lib/utils"; 

export default function News({ count, initialData }) {
  const { lang } = useLang();

  // 🎯 使用用外殼傳進來的資料進行防空保護與排序
  const latestNews = useMemo(() => {
    const baseNews = Array.isArray(initialData) ? initialData : [];
    
    return [...baseNews]
      .sort((a, b) => {
        // ⚡ 黑科技：因為您後台將 id 設定為 "2026-06-08-1" 的格式，
        // 直接拿 id 做字典序列倒序比對，絕對能排出完美的新舊順序，完全不怕英文日期格式解析失敗
        return String(b.id || "").localeCompare(String(a.id || ""));
      })
      .slice(0, count);
  }, [initialData, count]);

  return (
    <section
      id="news"
      className="min-h-screen flex flex-col items-stretch relative z-20"
    >
      <header className="pt-24 text-center">
        <h1 id="news-title" className="text-4xl my-5">
          News
        </h1>
      </header>

      {/* 卡片區 → grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-[1200px] mx-auto px-5 flex-1 my-5">
        {latestNews.map((item, index) => (
          <NewsCard
            // 🎯 修改點：React 列表 key 改綁 item.id，且 href 改吃對齊後的 item.id
            key={item.id || index}
            href={`/news/${item.id}`}
            // 🎯 修改點：圖片路徑改由 getNewsImagePath 動態指派（本地或 R2）
            image={getNewsImagePath(item.image)}
            alt={item.alt}
            title={item.title?.[lang] || item.title?.en || ""}
            date={item.date}
          />
        ))}
      </div>
    </section>
  );
}