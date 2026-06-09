"use client";
import { useMemo } from "react";
import NewsCard from "@/app/_components/ui/Newscard.js";
import { useLang } from "@/app/_lib/langContext";
import { getNewsImagePath } from "@/app/_lib/utils"; 

export default function News({ count, initialData }) {
  const { lang } = useLang();

  const latestNews = useMemo(() => {
    const baseNews = Array.isArray(initialData) ? initialData : [];
    
    return [...baseNews]
      .sort((a, b) => {
        return String(b.id || "").localeCompare(String(a.id || ""));
      })
      .slice(0, count);
  }, [initialData, count]);

  return (
    <section
      id="news"
      className="min-h-screen flex flex-col items-stretch relative z-20 font-sans antialiased text-[#1A1A1A] bg-[#FAFAFA]"
    >
      {/* 🎯 大標題優育化：改為輕盈細體、加寬字距，帶出雜誌感 */}
      <header className="pt-24 text-center">
        <h1 id="news-title" className="text-4xl my-5 font-light tracking-[0.15em] uppercase text-neutral-900">
          News
        </h1>
      </header>

      {/* 卡片區 → 完全保留您最滿意的原始均等網格 Grid 佈局 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-[1200px] mx-auto px-5 flex-1 my-5 pb-50">
        {latestNews.map((item, index) => (
          <NewsCard
            key={item.id || index}
            href={`/news/${item.id}`}
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